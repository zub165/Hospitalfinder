from http.server import HTTPServer, SimpleHTTPRequestHandler
import ssl

def run_https_server():
    # Create server
    server_address = ('', 8443)  # Port 8443 for HTTPS
    httpd = HTTPServer(server_address, SimpleHTTPRequestHandler)
    
    # Create SSL context
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain('cert.pem', 'key.pem')  # Use the certificate and key we generated
    
    # Wrap the socket with SSL
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
    
    print('Starting HTTPS server on https://localhost:8443...')
    httpd.serve_forever()

if __name__ == '__main__':
    run_https_server() 