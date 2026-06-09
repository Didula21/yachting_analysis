from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from rapidfuzz import process, fuzz
import os
import base64
import re
from datetime import datetime

app = Flask(__name__)

# ============================================
# CORS INITIALIZATION (Cross-Origin Resource Sharing)
# ============================================
# Connects frontend to backend securely across decoupled dev server ports
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

# ============================================
# FOLDERS
# ============================================
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# ============================================
# STATIC DATA FILES
# ============================================
EB_FILE = 'data/EB.xlsx'
MARINA_FILE = 'data/Marina.xlsx'
COUNTRY_TERRITORY_FILE = 'data/Country_Territory.xlsx'
CREW_FILE = 'data/crew.xlsx'

# Global Reference Dataframes
eb_df = pd.DataFrame()
marina_df = pd.DataFrame()
territory_df = pd.DataFrame()
crew_df = pd.DataFrame()

def load_reference_data():
    global eb_df, marina_df, territory_df, crew_df
    try:
        if os.path.exists(EB_FILE):
            eb_df = pd.read_excel(EB_FILE)
            eb_df.columns = eb_df.columns.str.strip()
            eb_df['Listing Name Clean'] = eb_df['Listing Name'].astype(str).str.lower().str.strip()

        if os.path.exists(MARINA_FILE):
            marina_df = pd.read_excel(MARINA_FILE)
            marina_df.columns = marina_df.columns.str.strip()
            marina_df['Marina Name Clean'] = marina_df['Marina Name'].astype(str).str.lower().str.strip()

        if os.path.exists(COUNTRY_TERRITORY_FILE):
            territory_df = pd.read_excel(COUNTRY_TERRITORY_FILE)
            territory_df.columns = territory_df.columns.str.strip()

        if os.path.exists(CREW_FILE):
            crew_df = pd.read_excel(CREW_FILE)
            crew_df.columns = crew_df.columns.str.strip()
            if 'Email' in crew_df.columns:
                crew_df['Email_Clean'] = crew_df['Email'].astype(str).str.lower().str.strip()
    except Exception as e:
        print(f"Critical error loading reference files: {str(e)}")

# Initial invocation
load_reference_data()

# ============================================
# FUZZY MATCH FUNCTIONS
# ============================================
def fuzzy_match(name, choices, threshold=80):
    if not name or pd.isna(name) or str(name).strip() == "" or not choices:
        return None
    result = process.extractOne(name, choices, scorer=fuzz.token_sort_ratio)
    if result is None:
        return None
    matched_name, score, _ = result
    if score >= threshold:
        return matched_name
    return None

# ============================================
# MULTIQUOTE FUNCTION
# ============================================
def classify_group(group):
    group = group.sort_values(by='date').copy()
    group['Is it Multiquote?'] = 'Repeat'
    count = len(group)

    if count == 1:
        group['Is it Multiquote?'] = 'Single'
        return group

    if group['date'].nunique() == 1:
        group['Is it Multiquote?'] = 'Results Page MQ'
        return group

    group['time_diff'] = group['date'].diff().dt.total_seconds()
    THRESHOLD_SECONDS = 60
    cluster_start_index = None

    for i in range(1, len(group)):
        current_diff = group.iloc[i]['time_diff']
        if pd.notna(current_diff) and current_diff <= THRESHOLD_SECONDS:
            cluster_start_index = i - 1
            break

    if cluster_start_index is not None:
        loc_idx = group.columns.get_loc('Is it Multiquote?')
        group.iloc[cluster_start_index, loc_idx] = 'Post Enquiry Pop-up Index'
        group.iloc[cluster_start_index + 1:, loc_idx] = 'Post Enquiry Pop-up MQ'

    group.drop(columns=['time_diff'], inplace=True, errors='ignore')
    return group

# ============================================
# CREW EMAIL POSITION INFERENCE FALLBACK
# ============================================
def infer_position_from_email(email_str):
    if pd.isna(email_str) or not email_str or '@' not in str(email_str):
        return None
    
    username = str(email_str).split('@')[0].lower().strip()
    
    inference_rules = [
        (r'(chief\s*eng|chief\s*engineer|ch\s*eng|cheng)', 'Chief Engineer'),
        (r'(chief\s*off|chief\s*officer|ch\s*off)', 'Chief Officer'),
        (r'(nav\s*off|navigation\s*officer)', 'Navigation Officer'),
        (r'(stewardess|stewards|steward|stew)', 'Steward / Stewardess'),
        (r'(deckhand|deck\s*hand|decky)', 'Deckhand'),
        (r'(captain|capt|cpt)', 'Captain'),
        (r'(engineer|eng|engin)', 'Engineer'),
        (r'(officer|off)', 'Officer'),
        (r'(purser|purs)', 'Purser'),
        (r'(bosun|boatswain)', 'Bosun'),
        (r'(chef|cook)', 'Chef'),
        (r'(mate)', 'Mate'),
        (r'(interior)', 'Interior Crew'),
        (r'(crew|yacht\s*crew)', 'Yacht Crew')
    ]
    
    for pattern, position_label in inference_rules:
        if re.search(pattern, username):
            return position_label
            
    return None

# ============================================
# ROUTE PROCESSING (UPLOAD PIPELINE ENGINE)
# ============================================
@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        filepath = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filepath)

        load_reference_data()

        if file.filename.endswith('.csv'):
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath)

        df.columns = df.columns.str.strip()

        # Core input mappings/normalization to standard forms
        standard_mappings = {
            'listing name': 'Listing Name',
            'subject': 'subject',
            'date': 'date',
            'message': 'message',
            'email': 'email',
            'id': 'id',
            'first name': 'first_name',
            'last name': 'last_name',
            'level': 'level',
            'quality': 'quality',
            'phone': 'phone',
            'approved': 'approved',
            'approved date': 'approved_date'
        }
        
        for raw_col in df.columns:
            cleaned_raw = raw_col.lower().replace('_', ' ').strip()
            if cleaned_raw in standard_mappings:
                df.rename(columns={raw_col: standard_mappings[cleaned_raw]}, inplace=True)

        # Enforce baseline minimum structural requirements
        baseline_cols = ['Listing Name', 'subject', 'date', 'message']
        for col in baseline_cols:
            if col not in df.columns:
                df[col] = ""

        if 'email' not in df.columns:
            df['email'] = ""

        # Clean validation helper inputs
        df['Listing Name Clean'] = df['Listing Name'].astype(str).str.lower().str.strip()
        df['Subject Clean'] = df['subject'].astype(str).str.lower().str.strip()
        df['date'] = pd.to_datetime(df['date'], errors='coerce').fillna(pd.Timestamp.now())

        # Generate structural times sent parameters
        df['Time Sent'] = df['date'].dt.strftime('%I:%M:%S %p')
        df['Day of Week'] = df['date'].dt.day_name()

        # Apply multiquote logic loops
        if 'message' in df.columns and len(df) > 0:
            df['message'] = df['message'].astype(str).fillna('')
            df = df.groupby('message', group_keys=False, dropna=False).apply(classify_group)
        else:
            df['Is it Multiquote?'] = 'Single'

        # Reference setup lists
        eb_choices = eb_df['Listing Name Clean'].dropna().tolist() if not eb_df.empty else []
        marina_choices = marina_df['Marina Name Clean'].dropna().tolist() if not marina_df.empty else []
        crew_choices = crew_df['Email_Clean'].dropna().tolist() if not crew_df.empty else []
        
        territory_lookup = {}
        if not territory_df.empty and 'Country' in territory_df.columns and 'Territory' in territory_df.columns:
            territory_lookup = dict(zip(territory_df['Country'].astype(str).str.strip().str.lower(), 
                                        territory_df['Territory'].astype(str).str.strip()))

        # Target structure container initializations
        df['Listing Country'] = None
        df['Listing Territory'] = None
        df['Primary Category'] = None
        df['Secondary Category'] = None
        
        # Senders designations mapped via matching logic matrix
        df['Country'] = None 
        df['Terriory'] = None
        df['Same Country'] = 'No'
        df['Same Territory'] = 'No'

        # Crew components
        df['Crew Position'] = None
        df['Type'] = None
        df['Yacht Name'] = None
        df['Length'] = None
        df['Shipyard'] = None

        # Cross Match Processing Pipeline Loop
        for idx in df.index:
            listing_name = df.at[idx, 'Listing Name Clean']
            subject_name = df.at[idx, 'Subject Clean']
            input_email = str(df.at[idx, 'email']).strip().lower() if pd.notna(df.at[idx, 'email']) else ""

            # 1. Match Listings
            if not eb_df.empty and pd.notna(listing_name):
                matched_name = fuzzy_match(listing_name, eb_choices)
                if matched_name:
                    m_rows = eb_df[eb_df['Listing Name Clean'] == matched_name]
                    if not m_rows.empty:
                        matched_row = m_rows.iloc[0]
                        df.at[idx, 'Listing Country'] = matched_row.get('Listing Country', None)
                        df.at[idx, 'Listing Territory'] = matched_row.get('Listing Territory', None)
                        df.at[idx, 'Primary Category'] = matched_row.get('Listing Category 1', None)
                        df.at[idx, 'Secondary Category'] = matched_row.get('Listing Category 2', None)

            # 2. Match Senders country data via Marinas Subject reference checks
            if not marina_df.empty and pd.notna(subject_name):
                matched_marina = fuzzy_match(subject_name, marina_choices)
                if matched_marina:
                    mar_rows = marina_df[marina_df['Marina Name Clean'] == matched_marina]
                    if not mar_rows.empty:
                        matched_row = mar_rows.iloc[0]
                        df.at[idx, 'Country'] = matched_row.get('Country', None)

            # 3. Map Senders Territory
            sender_country = df.at[idx, 'Country']
            if pd.notna(sender_country) and str(sender_country).strip().lower() in territory_lookup:
                df.at[idx, 'Terriory'] = territory_lookup[str(sender_country).strip().lower()]

            # 4. Cross Compare Calculations Matrix
            s_country = df.at[idx, 'Country']
            l_country = df.at[idx, 'Listing Country']
            s_territory = df.at[idx, 'Terriory']
            l_territory = df.at[idx, 'Listing Territory']

            if pd.isna(l_country) or pd.isna(s_country):
                df.at[idx, 'Same Country'] = None
            elif str(l_country).strip().lower() == str(s_country).strip().lower():
                df.at[idx, 'Same Country'] = 'Yes'

            if pd.isna(l_territory) or pd.isna(s_territory):
                df.at[idx, 'Same Territory'] = None
            elif str(l_territory).strip().lower() == str(s_territory).strip().lower():
                df.at[idx, 'Same Territory'] = 'Yes'

            # 5. Crew Enrichment Evaluation Logic
            crew_matched = False
            if not crew_df.empty and input_email:
                matched_crew_email = None
                if input_email in crew_choices:
                    matched_crew_email = input_email
                else:
                    matched_crew_email = fuzzy_match(input_email, crew_choices, threshold=85)

                if matched_crew_email:
                    c_rows = crew_df[crew_df['Email_Clean'] == matched_crew_email]
                    if not c_rows.empty:
                        crew_row = c_rows.iloc[0]
                        df.at[idx, 'Crew Position'] = crew_row.get('Position', None)
                        df.at[idx, 'Type'] = crew_row.get('YachtType', None)
                        df.at[idx, 'Yacht Name'] = crew_row.get('YachtName', None)
                        df.at[idx, 'Length'] = crew_row.get('Length', None)
                        df.at[idx, 'Shipyard'] = crew_row.get('Shipyard', None)
                        crew_matched = True

            # Regex positional fallback system
            if not crew_matched and input_email:
                inferred_pos = infer_position_from_email(input_email)
                if inferred_pos:
                    df.at[idx, 'Crew Position'] = f"{inferred_pos} (Inferred)"

        # ============================================
        # STRICT OUTPUT ORDER AND RENAMING SCHEMA
        # ============================================
        desired_order = [
            'id', 'Listing Name', 'first_name', 'last_name', 'email', 
            'level', 'quality', 'phone', 'subject', 'message', 
            'date', 'approved', 'approved_date', 'Time Sent', 'Day of Week', 
            'Is it Multiquote?', 'Country', 'Terriory', 'Listing Country', 'Listing Territory', 
            'Same Country', 'Same Territory', 'Primary Category', 'Secondary Category', 
            'Crew Position', 'Type', 'Yacht Name', 'Length', 'Shipyard'
        ]

        # Inject clean empty defaults if any structural target columns are missing
        for target_column in desired_order:
            if target_column not in df.columns:
                df[target_column] = None

        # Re-slice and drop helper processing variables completely
        final_df = df[desired_order].copy()

        # Save Structured Output Document Workbook
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_filename = f'processed_output_{timestamp}.xlsx'
        output_path = os.path.join(OUTPUT_FOLDER, output_filename)
        final_df.to_excel(output_path, index=False)

        # Standard KPI metrics
        total_enquiries = len(final_df)
        unique_listings = final_df['Listing Name'].nunique()
        multiquote_count = final_df['Is it Multiquote?'].isin([
            'Post Enquiry Pop-up Index', 
            
        ]).sum()

        same_country_yes = (final_df['Same Country'] == 'Yes').sum()
        same_territory_yes = (final_df['Same Territory'] == 'Yes').sum()

        # Chart summaries mapping
        weekday_distribution = final_df['Day of Week'].value_counts().to_dict()
        country_distribution = final_df['Listing Country'].dropna().value_counts().head(5).to_dict()
        multiquote_distribution = final_df['Is it Multiquote?'].value_counts().to_dict()
        time_distribution = {int(k): int(v) for k, v in pd.to_datetime(final_df['date']).dt.hour.value_counts().sort_index().to_dict().items()}

        # Generate Safe Preview records object array mapping
        preview_df = final_df.head(20).copy()
        for col in preview_df.columns:
            if pd.api.types.is_datetime64_any_dtype(preview_df[col]):
                preview_df[col] = preview_df[col].dt.strftime('%Y-%m-%d %H:%M:%S')
        
        preview_data = preview_df.fillna('').to_dict(orient='records')

        with open(output_path, "rb") as f:
            excel_bytes = f.read()
        excel_base64 = base64.b64encode(excel_bytes).decode("utf-8")

        return jsonify({
            "analytics": {
                "total_enquiries": int(total_enquiries),
                "unique_listings": int(unique_listings),
                "multiquote_count": int(multiquote_count),
                "same_country_yes": int(same_country_yes),
                "same_territory_yes": int(same_territory_yes),
                "weekday_distribution": weekday_distribution,
                "country_distribution": country_distribution,
                "multiquote_distribution": multiquote_distribution,
                "time_distribution": time_distribution,
                "preview": preview_data
            },
            "file": excel_base64,
            "filename": output_filename
        })

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': f"Internal Server Processing Exception: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)