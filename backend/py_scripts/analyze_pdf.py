import sys
import fitz  # pymupdf
import json

def extract_text_from_pdf(pdf_bytes):
    """ Extracts text from a PDF binary. """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = "\n".join([page.get_text("text") for page in doc])
    return text

def extract_metadata(text):
    """ Extracts sample size and study size using regex. """
    import re
    sample_size = re.search(r"sample size of (\d+)", text, re.IGNORECASE)
    study_size = re.search(r"study size (\d+)", text, re.IGNORECASE)
    
    return {
        "sample_size": sample_size.group(1) if sample_size else "Not found",
        "study_size": study_size.group(1) if study_size else "Not found"
    }

def main():
    """ Reads binary input from Node.js, extracts text, and outputs metadata. """
    pdf_bytes = sys.stdin.buffer.read()  # Read binary data from stdin
    text = extract_text_from_pdf(pdf_bytes)
    insights = extract_metadata(text)

    print(json.dumps(insights))  # Send JSON back to Node.js

if __name__ == "__main__":
    main()
