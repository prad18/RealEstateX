import pytesseract
from PIL import Image
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import requests
import spacy
from fuzzywuzzy import fuzz
import re
from dotenv import load_dotenv
import os
from io import BytesIO

# Load environment variables (REGRID_API_KEY)
load_dotenv()
API_KEY = os.getenv("REGRID_API_KEY")

# Load spaCy English model (run `python -m spacy download en_core_web_sm` if not found)
nlp = spacy.load("en_core_web_sm")

# Optional: Manually set Tesseract path if needed (adjust as per your env)
pytesseract.pytesseract.tesseract_cmd = r'F:\Tessaract-OCR\tesseract.exe'

# FastAPI app
app = FastAPI()

# --- CORS Middleware for frontend-backend communication ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev: allow all. For prod, restrict as needed.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- OCR + NLP helpers ---
def extract_text_from_image(file_bytes):
    image = Image.open(file_bytes)
    return pytesseract.image_to_string(image)

def extract_owners_with_spacy(text):
    doc = nlp(text)
    return [
        ent.text.upper()
        for ent in doc.ents
        if ent.label_ == "PERSON" and len(ent.text.split()) >= 2
    ]

def is_name_match(ocr_name, regrid_name, threshold=70):
    if not ocr_name or not regrid_name:
        return False
    ocr_name = ocr_name.strip().upper()
    regrid_name = regrid_name.strip().upper()
    fuzzy_score = fuzz.partial_ratio(ocr_name, regrid_name)
    if fuzzy_score >= threshold:
        return True
    ocr_initials = ''.join([part[0] for part in ocr_name.split()])
    regrid_initials = ''.join([part[0] for part in regrid_name.split()])
    return ocr_initials == regrid_initials

# --- Main endpoint ---
@app.post("/verify")
async def verify(title: UploadFile = File(...), id: UploadFile = File(...)):
    try:
        # Read file bytes
        deed_bytes = await title.read()
        id_bytes = await id.read()
        deed_text = extract_text_from_image(BytesIO(deed_bytes))
        id_text = extract_text_from_image(BytesIO(id_bytes))

        deed_owner_names = extract_owners_with_spacy(deed_text)
        id_owner_names = extract_owners_with_spacy(id_text)

        # Address regex (expand if needed)
        address_match = re.search(
            r"\d{2,6}\s+[A-Z0-9\s\-]+(?:RD|ST|AVE|DR|LN|BLVD|ROAD|LANE|COURT|PL|PLACE|TRAIL|WAY|CIR|CIRCLE|PKWY|PARKWAY)",
            deed_text.upper()
        )
        if not address_match:
            return JSONResponse(status_code=400, content={"match": False, "error": "Address not found in deed text"})

        extracted_address = address_match.group(0)

        # Regrid API request
        url = "https://app.regrid.com/api/v2/parcels/address"
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "accept": "application/json"
        }
        params = {
            "query": extracted_address,
            "path": "/us/tx/dallas"
        }
        response = requests.get(url, headers=headers, params=params)
        if response.status_code != 200:
            return JSONResponse(status_code=500, content={"match": False, "error": "Failed to fetch parcel from Regrid"})

        data = response.json()
        features = data.get("parcels", {}).get("features", [])
        if not features:
            return JSONResponse(status_code=404, content={"match": False, "error": "No parcel found for the given address"})

        props = features[0].get("properties", {})
        fields = props.get("fields", {})
        enhanced = props.get("enhanced_ownership", [])

        regrid_owner = (
            enhanced[0].get("eo_owner")
            if enhanced and "eo_owner" in enhanced[0]
            else fields.get("owner", "")
        )
        regrid_address = f"{fields.get('address', '')}, {fields.get('scity', '')}, {fields.get('szip', '')}"

        matched_id_name = next((name for name in id_owner_names if is_name_match(name, regrid_owner)), None)
        matched_deed_name = next((name for name in deed_owner_names if is_name_match(name, regrid_owner)), None)

        address_tokens = [
            fields.get("saddno", ""),
            fields.get("saddstr", ""),
            fields.get("saddsttyp", ""),
            fields.get("scity", ""),
            fields.get("szip5", "")
        ]
        deed_text_upper = deed_text.upper()
        matched_tokens = [token for token in address_tokens if token and token.upper() in deed_text_upper]
        deed_address_match = len(matched_tokens) >= 3

        valuation = {
            "total_value": fields.get("parval", 0),
            "land_value": fields.get("landval", 0),
            "improvement_value": fields.get("improvval", 0)
        }

        match_result = deed_address_match and (
            (matched_deed_name is not None) or (matched_id_name is not None)
        )

        # Response
        return JSONResponse(content={
            "match": match_result,
            "deed_address_match": deed_address_match,
            "extracted_deed_names": deed_owner_names,
            "extracted_id_names": id_owner_names,
            "matched_name_from_deed": matched_deed_name,
            "matched_name_from_id": matched_id_name,
            "owner_name_match_from_deed": matched_deed_name is not None,
            "owner_name_match_from_id": matched_id_name is not None,
            "regrid_owner": regrid_owner,
            "regrid_address": regrid_address,
            "valuation": valuation
        })

    except Exception as e:
        return JSONResponse(status_code=500, content={"match": False, "error": str(e)})
