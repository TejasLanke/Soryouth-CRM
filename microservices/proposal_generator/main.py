
import os
import tempfile
import io
import pythoncom
import base64
from flask import Flask, request, jsonify, send_file
from docxtpl import DocxTemplate
from docx2pdf import convert

app = Flask(__name__)

# This assumes the Python service is run from the `microservices/proposal_generator` directory
# and the main project root is two levels up.
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

@app.route('/generate', methods=['POST'])
def generate_proposal():
    pythoncom.CoInitialize()  # Initialize the COM library for this thread
    try:
        payload = request.get_json()
        if not payload:
            return jsonify({"error": "Invalid JSON payload"}), 400

        template_path_relative = payload.get('template_path')
        context = payload.get('data')

        if not template_path_relative or not context:
            return jsonify({"error": "Missing 'template_path' or 'data' in payload"}), 400

        # Construct the absolute path to the template
        if template_path_relative.startswith('/'):
            template_path_relative = template_path_relative[1:]
            
        template_full_path = os.path.join(PROJECT_ROOT, 'public', template_path_relative)

        if not os.path.exists(template_full_path):
            return jsonify({"error": f"Template not found at: {template_full_path}"}), 404
        
        doc = DocxTemplate(template_full_path)
        
        # Render the template using the default {{...}} placeholders
        doc.render(context)
        
        # Use a temporary directory to save the intermediate docx and the final pdf
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_docx_path = os.path.join(temp_dir, 'output.docx')
            temp_pdf_path = os.path.join(temp_dir, 'output.pdf')
            
            doc.save(temp_docx_path)
            
            convert(temp_docx_path, temp_pdf_path)

            if not os.path.exists(temp_pdf_path):
                 return jsonify({"error": "PDF conversion failed. The output PDF file was not created."}), 500

            # Read both generated files into in-memory buffers
            with open(temp_docx_path, 'rb') as f_docx:
                docx_buffer = f_docx.read()
            
            with open(temp_pdf_path, 'rb') as f_pdf:
                pdf_buffer = f_pdf.read()

        # The 'with' block has now closed, and the temporary directory and its files are deleted.
        
        # Encode buffers to Base64
        docx_b64 = base64.b64encode(docx_buffer).decode('utf-8')
        pdf_b64 = base64.b64encode(pdf_buffer).decode('utf-8')
        
        return jsonify({
            "success": True,
            "pdf_b64": pdf_b64,
            "docx_b64": docx_b64
        })

    except Exception as e:
        print(f"An error occurred: {e}")
        # Make sure to uninitialize COM on error as well
        pythoncom.CoUninitialize()
        return jsonify({"error": f"Python service error: {str(e)}"}), 500
    finally:
        pythoncom.CoUninitialize()


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001, debug=True)
