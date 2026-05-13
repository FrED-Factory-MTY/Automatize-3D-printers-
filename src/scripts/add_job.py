import sys
import json
import time
from bambulabs_api import Printer

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing input"}))
        return

    try:
        data = json.loads(sys.argv[1])
        ip = data.get('ip')
        access_code = data.get('accessCode')
        serial = data.get('serial')
        filepath = data.get('filepath')
        filename = data.get('filename')
        plate_number = data.get('plate_number', 1)

        printer = Printer(ip_address=ip, access_code=access_code, serial=serial)
        printer.connect()
        time.sleep(1) # wait for connection
        
        # Upload the file to the printer's FTP server
        with open(filepath, 'rb') as f:
            ftp_path = printer.upload_file(f, filename)
        
        # Start the print using the uploaded filename on the printer
        success = printer.start_print(filename=filename, plate_number=plate_number)
        printer.disconnect()
        
        if success:
            print(json.dumps({"success": True}))
        else:
            print(json.dumps({"error": "Failed to start print"}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == '__main__':
    main()
