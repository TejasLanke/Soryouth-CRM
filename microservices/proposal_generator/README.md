
# Proposal Generation Microservice

This Python Flask microservice handles the generation of proposals from `.docx` templates.

## Functionality

- Receives a request with the path to a template and a JSON data payload.
- Uses `docxtpl` to populate the `.docx` template with the provided data.
- Converts the populated `.docx` file to a `.pdf` file.
- Returns the final `.pdf` file in the response.

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

Because our application file is named `main.py`, you need to tell Flask where to find it. Run the following command from within the `microservices/proposal_generator` directory:

```bash
flask --app main run --port 5001
```

The service will start on `http://127.0.0.1:5001`.

## Important Note on Dependencies

This service uses the `docx2pdf` library, which relies on the **Microsoft Office COM interface**. This means it will **only work on a Windows machine with Microsoft Word installed**.

For Linux or macOS environments, you would need to replace `docx2pdf` with a solution that uses LibreOffice headless mode, which requires LibreOffice to be installed on the server.
