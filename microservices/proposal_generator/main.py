
import os
import tempfile
import io
import pythoncom
import base64
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend for servers
import matplotlib.pyplot as plt
import matplotlib.ticker

from flask import Flask, request, jsonify
from docxtpl import DocxTemplate, InlineImage
from docx2pdf import convert
from docx.shared import Inches

app = Flask(__name__)

def create_monthly_generation_chart(doc, capacity_kw):
    """Generates a bar chart for monthly solar production."""
    if not capacity_kw or capacity_kw <= 0:
        return None
        
    generation_per_day = capacity_kw * 4
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    # Updated seasonal factors for more accuracy
    seasonal_factors = [0.95, 0.97, 1.10, 1.13, 1.14, 0.93, 0.75, 0.79, 0.87, 1.02, 1.00, 0.99]
    monthly_generation = [generation_per_day * days * factor for days, factor in zip(days_in_month, seasonal_factors)]

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.bar(months, monthly_generation, color='#00BFFF') # Primary color: Deep Sky Blue
    ax.set_ylabel('Energy Produced (in kWh)')
    ax.set_xlabel('Months')
    ax.set_title('Monthly Solar Production')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()

    memfile = io.BytesIO()
    plt.savefig(memfile, format='png', dpi=150)
    memfile.seek(0)
    plt.close(fig)

    return InlineImage(doc, memfile, width=Inches(6.0))


def create_yearly_savings_chart(doc, capacity_kw, unit_rate):
    """Generates a line chart for yearly savings over 30 years."""
    if not capacity_kw or capacity_kw <= 0 or not unit_rate or unit_rate <= 0:
        return None

    initial_generation_per_year = capacity_kw * 4 * 365
    years = list(range(1, 31))
    savings = []
    
    current_generation = initial_generation_per_year
    current_rate = unit_rate

    for _ in years:
        savings.append(current_generation * current_rate)
        # Apply yearly degradation and rate increments
        current_generation *= 0.996  # 0.4% decrement
        current_rate *= 1.02      # 2% increment

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.plot(years, savings, marker='o', linestyle='-', color='#FFB347') # Accent color: Orange-yellow
    ax.set_ylabel('Projected Savings (in ₹)')
    ax.set_xlabel('Year')
    ax.set_title('Projected Yearly Savings for 30 Years')
    ax.grid(True, which='both', linestyle='--', linewidth=0.5)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.get_yaxis().set_major_formatter(matplotlib.ticker.FuncFormatter(lambda x, p: format(int(x), ',')))
    plt.tight_layout()

    memfile = io.BytesIO()
    plt.savefig(memfile, format='png', dpi=150)
    memfile.seek(0)
    plt.close(fig)

    return InlineImage(doc, memfile, width=Inches(6.0))

@app.route('/generate', methods=['POST'])
def generate_proposal():
    pythoncom.CoInitialize()
    try:
        payload = request.get_json()
        if not payload:
            return jsonify({"error": "Invalid JSON payload"}), 400

        template_full_path = payload.get('template_path')
        context = payload.get('data')

        if not template_full_path or not context:
            return jsonify({"error": "Missing 'template_path' or 'data' in payload"}), 400

        if not os.path.exists(template_full_path):
            return jsonify({"error": f"Template not found at provided path"}), 404
        
        doc = DocxTemplate(template_full_path)
        
        # --- Graph Generation ---
        raw_capacity = context.get('capacity')
        raw_unit_rate = context.get('unit_rate')
        
        capacity_kw = 0
        if raw_capacity:
            try:
                capacity_kw = float(str(raw_capacity).replace(',', ''))
            except (ValueError, TypeError):
                capacity_kw = 0

        unit_rate = 0
        if raw_unit_rate:
            try:
                unit_rate = float(str(raw_unit_rate).replace(',', ''))
            except (ValueError, TypeError):
                unit_rate = 0
                
        monthly_chart_image = create_monthly_generation_chart(doc, capacity_kw)
        if monthly_chart_image:
            context['monthly_generation_chart'] = monthly_chart_image
        
        yearly_savings_chart_image = create_yearly_savings_chart(doc, capacity_kw, unit_rate)
        if yearly_savings_chart_image:
            context['yearly_savings_chart'] = yearly_savings_chart_image
        # --- End Graph Generation ---

        doc.render(context)
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_docx_path = os.path.join(temp_dir, 'output.docx')
            temp_pdf_path = os.path.join(temp_dir, 'output.pdf')
            doc.save(temp_docx_path)
            convert(temp_docx_path, temp_pdf_path)

            if not os.path.exists(temp_pdf_path):
                 return jsonify({"error": "PDF conversion failed."}), 500

            with open(temp_docx_path, 'rb') as f_docx, open(temp_pdf_path, 'rb') as f_pdf:
                docx_buffer = f_docx.read()
                pdf_buffer = f_pdf.read()

        docx_b64 = base64.b64encode(docx_buffer).decode('utf-8')
        pdf_b64 = base64.b64encode(pdf_buffer).decode('utf-8')
        
        return jsonify({
            "success": True,
            "pdf_b64": pdf_b64,
            "docx_b64": docx_b64
        })

    except Exception as e:
        print(f"An error occurred: {e}")
        pythoncom.CoUninitialize()
        return jsonify({"error": f"Python service error: {str(e)}"}), 500
    finally:
        pythoncom.CoUninitialize()

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001, debug=True)
