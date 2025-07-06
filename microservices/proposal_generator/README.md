# Proposal Generation Microservice

This Python Flask microservice handles the generation of proposals from `.docx` templates.

## Functionality

- Receives a request with the path to a template and a JSON data payload.
- Uses `docxtpl` to populate the `.docx` template with the provided data.
- Converts the populated `.docx` file to a `.pdf` file using LibreOffice.
- Returns both the generated DOCX and PDF files in the response.

## Setup

1.  Navigate to this directory:
    ```bash
    cd microservices/proposal_generator
    ```

2.  It's recommended to use a virtual environment:
    ```bash
    python -m venv venv
    ```

3.  Activate the virtual environment.

    - **On Windows (Command Prompt / PowerShell):**
      ```cmd
      venv\Scripts\activate
      ```
    
    - **On macOS / Linux:**
      ```bash
      source venv/bin/activate
      ```

4.  Install the required dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## Running the Service

You can run this service using different WSGI servers depending on your operating system and environment.

### For Production (Linux)

For a production environment on Linux, it is recommended to use `gunicorn`.

```bash
gunicorn --workers 3 --bind 0.0.0.0:5001 main:app
```

### For Development & Testing (Windows & cross-platform)

For local development or testing concurrent requests on Windows, `waitress` is an excellent choice.

```bash
waitress-serve --host 127.0.0.1 --port=5001 main:app
```

You can also use the built-in Flask development server for basic testing (not suitable for multiple requests):

```bash
flask --app main run --port 5001
```

## Important Note on Dependencies

This service uses **LibreOffice** for PDF conversion. This means **LibreOffice must be installed on the machine** where this microservice is running. 

The Python script will automatically try to find the correct executable (`soffice.exe` on Windows, `libreoffice` or `soffice` on Linux/macOS). For this to work, ensure the LibreOffice program directory is in your system's `PATH`, or that it's installed in a standard location (like `C:\Program Files\LibreOffice\program` on Windows).
