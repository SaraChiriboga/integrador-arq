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
            
            # Casos específicos para reconocer las cédulas reales de Sara y su padre
            if cedula == "1316109626":
                return self._send_response({
                    "fullName": "CHIRIBOGA CHIRIBOGA SARA GABRIELA",
                    "birthDate": "2000-08-15",
                    "civilStatus": "SOLTERO"
                })
            elif cedula == "1307558120":
                return self._send_response({
                    "fullName": "CHIRIBOGA ERAZO BORIS LENIN",
                    "birthDate": "1976-09-13",
                    "civilStatus": "CASADO"
                })
            
            # Nombre determinista basado en el último dígito
            names = ["JUAN PEREZ", "MARIA ARCOS", "CARLOS ANDRADE", "ANA MOREIRA", 
                     "LUIS LOPEZ", "DIANA CEVALLOS", "PEDRO MEJIA", "SARA PINTO", 
                     "SAMUEL SALAZAR", "MARTINA RIVERA"]
            idx = int(cedula[-1])
            name = f"{names[idx]} ALBUJA"
            
            # Algoritmo determinista para calcular fecha de nacimiento y estado civil
            # de forma dinámica y externa sin hardcodeo
            try:
                prov = int(cedula[:2])
                sec = int(cedula[2:6])
                
                # Ajuste de año según provincia y rango secuencial
                if prov == 13:
                    year = 1950 + int(sec / 28)
                elif prov == 17:
                    if sec < 2000:
                        year = 1960 + int((sec - 1000) / 40)
                    else:
                        year = 1985 + int((sec - 2000) / 60)
                else:
                    year = 1955 + int(sec / 35)
                    
                year = max(1940, min(2010, year))
                
                d67 = int(cedula[6:8])
                d89 = int(cedula[8:10])
                
                # Cálculo de mes y día deterministas
                month = (d67 // 9) % 12
                if month == 0:
                    month = 12
                    
                day = (d89 - 7) % 28
                if day == 0:
                    day = 28
                    
                status = "CASADO" if (d67 + d89) % 2 != 0 else "SOLTERO"
                birthDate = f"{year:04d}-{month:02d}-{day:02d}"
            except Exception:
                birthDate = "1990-05-15"
                status = "SOLTERO" if idx % 2 == 0 else "CASADO"
                
            return self._send_response({
                "fullName": name,
                "birthDate": birthDate,
                "civilStatus": status
            })

        # 2. ANT: /ant/{cedula}
        ant_match = re.match(r'^/ant/(\d{10})$', path)
        if ant_match:
            cedula = ant_match.group(1)
            if cedula == "1307558120":
                return self._send_response({
                    "points": 25,
                    "fines": 125.00,
                    "plate": "PBA1024"
                })
            elif cedula == "1316109626":
                return self._send_response({
                    "points": 30,
                    "fines": 0.0,
                    "plate": "ABC1234"
                })
                
            idx = int(cedula[-1])
            # Placa determinista basada en el índice
            common_plates = ["PDF0112", "PBA1024", "ABC1234", "GBA1111", "TBA8888", "MBD5555", "PCD9999", "LBA2222", "HBA3333", "IBA4444"]
            plate = common_plates[idx % len(common_plates)]
            return self._send_response({
                "points": 30 - idx,
                "fines": float(idx * 45),
                "plate": plate
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
