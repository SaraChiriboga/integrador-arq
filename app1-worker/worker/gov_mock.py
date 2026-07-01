import json
from http.server import HTTPServer, BaseHTTPRequestHandler
import re

PORT = 8083

class GovMockHandler(BaseHTTPRequestHandler):
    def _send_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_GET(self):
        # Desglosar la ruta
        path = self.path
        
        # 1. Registro Civil: /rc/{cedula}
        rc_match = re.match(r'^/rc/(\d{10})$', path)
        if rc_match:
            cedula = rc_match.group(1)
            # Nombre determinista basado en el último dígito
            names = ["JUAN PEREZ", "MARIA ARCOS", "CARLOS ANDRADE", "ANA MOREIRA", 
                     "LUIS LOPEZ", "DIANA CEVALLOS", "PEDRO MEJIA", "SARA PINTO", 
                     "SAMUEL SALAZAR", "MARTINA RIVERA"]
            idx = int(cedula[-1])
            name = f"{names[idx]} ALBUJA"
            return self._send_response({
                "fullName": name,
                "birthDate": "1990-05-15",
                "civilStatus": "SOLTERO" if idx % 2 == 0 else "CASADO"
            })

        # 2. ANT: /ant/{cedula}
        ant_match = re.match(r'^/ant/(\d{10})$', path)
        if ant_match:
            cedula = ant_match.group(1)
            idx = int(cedula[-1])
            return self._send_response({
                "points": 30 - idx,
                "fines": float(idx * 45)
            })

        # 3. SENESCYT: /senescyt/1712345678
        senescyt_match = re.match(r'^/senescyt/(\d{10})$', path)
        if senescyt_match:
            cedula = senescyt_match.group(1)
            idx = int(cedula[-1])
            careers = ["INGENIERO EN SISTEMAS", "LICENCIADO EN ADMINISTRACION", "ABOGADO", 
                       "MEDICO CIRUJANO", "INGENIERO CIVIL", "ARQUITECTO"]
            career = careers[idx % len(careers)]
            return self._send_response([
                {
                    "title": career,
                    "university": "ESCUELA POLITECNICA NACIONAL" if idx % 2 == 0 else "UNIVERSIDAD CENTRAL DEL ECUADOR"
                }
            ])

        # 4. SRI: /sri/{cedula}
        sri_match = re.match(r'^/sri/(\d{10})$', path)
        if sri_match:
            cedula = sri_match.group(1)
            idx = int(cedula[-1])
            return self._send_response({
                "hasRuc": idx % 3 != 0,
                "taxStatus": "AL DIA" if idx % 2 == 0 else "CON DEUDAS"
            })

        # 5. IESS: /iess/{cedula}
        iess_match = re.match(r'^/iess/(\d{10})$', path)
        if iess_match:
            cedula = iess_match.group(1)
            idx = int(cedula[-1])
            return self._send_response({
                "isAffiliated": idx % 4 != 0,
                "contributions": idx * 30
            })

        # Ruta no encontrada
        self._send_response({"error": "Endpoint mock no encontrado"}, 404)

def run(server_class=HTTPServer, handler_class=GovMockHandler):
    server_address = ('', PORT)
    httpd = server_class(server_address, handler_class)
    print(f"Iniciando API de Gobierno Mock en el puerto {PORT}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()

if __name__ == '__main__':
    run()
