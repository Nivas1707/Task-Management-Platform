import sys
import subprocess
import os

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

try:
    import yaml
except ImportError:
    print("Installing PyYAML...")
    install("pyyaml")
    import yaml

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
except ImportError:
    print("Installing ReportLab...")
    install("reportlab")
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch

def generate_pdf(yaml_file, output_file):
    with open(yaml_file, 'r') as f:
        spec = yaml.safe_load(f)

    doc = SimpleDocTemplate(output_file, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Title
    title = spec.get('info', {}).get('title', 'API Documentation')
    story.append(Paragraph(title, styles['Title']))
    
    desc = spec.get('info', {}).get('description', '')
    story.append(Paragraph(desc, styles['Normal']))
    
    version = spec.get('info', {}).get('version', '1.0.0')
    story.append(Paragraph(f"Version: {version}", styles['Normal']))
    story.append(Spacer(1, 12))

    # Overview
    story.append(Paragraph("1. Overview", styles['Heading1']))
    base_url = spec.get('servers', [{}])[0].get('url', 'http://localhost:3000/api')
    story.append(Paragraph(f"<b>Base URL:</b> {base_url}", styles['Normal']))
    story.append(Paragraph("This API allows you to manage tasks, comments, files, and users. All requests must be made over HTTPS in production.", styles['Normal']))
    story.append(Spacer(1, 12))

    # Authentication
    story.append(Paragraph("2. Authentication", styles['Heading1']))
    story.append(Paragraph("This API uses Bearer Token authentication (JWT).", styles['Normal']))
    story.append(Paragraph("To authenticate, include the following header in your requests:", styles['Normal']))
    story.append(Spacer(1, 6))
    code_style = ParagraphStyle('Code', parent=styles['Code'], backColor=colors.lightgrey, borderColor=colors.black, borderWidth=1, leftIndent=20, rightIndent=20, spaceAfter=10)
    story.append(Paragraph("Authorization: Bearer <your_token>", code_style))
    story.append(Spacer(1, 12))

    # Rate Limits
    story.append(Paragraph("3. Rate Limits & Usage Policies", styles['Heading1']))
    story.append(Paragraph("To ensure service stability, rate limiting is enforced:", styles['Normal']))
    story.append(Paragraph("- <b>100 requests per 15 minutes</b> per IP address.", styles['Normal']))
    story.append(Paragraph("Exceeding this limit will result in a <code>429 Too Many Requests</code> response.", styles['Normal']))
    story.append(Spacer(1, 12))

    # Errors
    story.append(Paragraph("4. Error Handling", styles['Heading1']))
    story.append(Paragraph("The API uses standard HTTP status codes to indicate the success or failure of an API request.", styles['Normal']))
    error_data = [
        ['Code', 'Description', 'Possible Cause'],
        ['200', 'OK', 'Request succeeded.'],
        ['201', 'Created', 'Resource created successfully.'],
        ['400', 'Bad Request', 'Invalid input parameters or validation failure.'],
        ['401', 'Unauthorized', 'Missing or invalid authentication token.'],
        ['403', 'Forbidden', 'User does not have permission to access the resource.'],
        ['404', 'Not Found', 'The requested resource does not exist.'],
        ['429', 'Too Many Requests', 'Rate limit exceeded.'],
        ['500', 'Internal Server Error', 'An error occurred on the server side.'],
    ]
    t = Table(error_data, colWidths=[50, 100, 300])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    story.append(t)
    story.append(Spacer(1, 12))
    story.append(PageBreak())

    # Endpoints
    story.append(Paragraph("5. Endpoints & Methods", styles['Heading1']))
    paths = spec.get('paths', {})
    
    for path, methods in paths.items():
        story.append(Paragraph(f"Endpoint: {path}", styles['Heading2']))
        
        for method, details in methods.items():
            method_upper = method.upper()
            color = colors.blue
            if method_upper == 'GET': color = colors.green
            elif method_upper == 'POST': color = colors.orange
            elif method_upper == 'PUT': color = colors.purple
            elif method_upper == 'DELETE': color = colors.red
            
            method_style = ParagraphStyle('Method', parent=styles['Heading3'], textColor=color)
            story.append(Paragraph(f"{method_upper} {path}", method_style))
            
            summary = details.get('summary', 'No summary')
            story.append(Paragraph(f"<b>Summary:</b> {summary}", styles['Normal']))
            story.append(Spacer(1, 6))

            # Parameters
            params = details.get('parameters', [])
            if params:
                story.append(Paragraph("<b>Parameters:</b>", styles['Heading4']))
                data = [['Name', 'In', 'Type', 'Required', 'Description']]
                for p in params:
                    schema_type = p.get('schema', {}).get('type', 'string')
                    desc = p.get('description', '-')
                    data.append([p['name'], p['in'], schema_type, str(p.get('required', False)), desc])
                
                t = Table(data, colWidths=[80, 60, 60, 60, 180])
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ]))
                story.append(t)
                story.append(Spacer(1, 6))

            # Request Body
            request_body = details.get('requestBody', {})
            if request_body:
                content = request_body.get('content', {})
                json_content = content.get('application/json', {}) or content.get('multipart/form-data', {})
                schema = json_content.get('schema', {})
                
                if schema:
                    story.append(Paragraph("<b>Request Body:</b>", styles['Heading4']))
                    props = schema.get('properties', {})
                    required = schema.get('required', [])
                    
                    if props:
                        data = [['Field', 'Type', 'Required', 'Description']]
                        for prop_name, prop_details in props.items():
                            prop_type = prop_details.get('type', 'string')
                            is_required = prop_name in required
                            desc = prop_details.get('description', '-')
                            if prop_type == 'array':
                                items = prop_details.get('items', {})
                                prop_type = f"array[{items.get('type', 'string')}]"
                            
                            data.append([prop_name, prop_type, str(is_required), desc])
                        
                        t = Table(data, colWidths=[100, 80, 60, 200])
                        t.setStyle(TableStyle([
                            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                        ]))
                        story.append(t)
                        story.append(Spacer(1, 6))

            # Code Examples
            story.append(Paragraph("<b>Example Request (cURL):</b>", styles['Heading4']))
            curl_cmd = f"curl -X {method_upper} \"{base_url}{path}\" \\n"
            curl_cmd += "  -H \"Authorization: Bearer <token>\" \\n"
            curl_cmd += "  -H \"Content-Type: application/json\""
            
            if method_upper in ['POST', 'PUT', 'PATCH']:
                 curl_cmd += " \\n  -d '{...}'"
            
            story.append(Paragraph(curl_cmd, code_style))
            story.append(Spacer(1, 12))

    # Changelog
    story.append(PageBreak())
    story.append(Paragraph("6. Changelog", styles['Heading1']))
    changelog_data = [
        ['Date', 'Version', 'Description'],
        ['2026-02-12', '1.0.0', 'Initial release of the Task Management API.'],
    ]
    t = Table(changelog_data, colWidths=[80, 60, 300])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    story.append(t)

    doc.build(story)
    print(f"PDF generated: {output_file}")

if __name__ == "__main__":
    generate_pdf('swagger.yaml', 'api-docs.pdf')
