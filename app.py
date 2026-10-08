"""
DIAMOND SHOP
Sitio informativo de tienda (sin backend, sin pagos ni datos bancarios).

Ejecutar:
    pip install -r requirements.txt
    python app.py

Luego abrir: http://127.0.0.1:5000
"""

from flask import Flask, render_template, send_from_directory

app = Flask(__name__)


@app.route("/")
def index():
    """Pagina principal de la tienda."""
    return render_template("index.html")


@app.route("/img/<path:filename>")
def imagenes_tienda(filename):
    """Sirve el logo y demas imagenes que estan en /img (raiz del proyecto)."""
    return send_from_directory("img", filename)


@app.route("/salud")
def salud():
    """Endpoint simple para comprobar que el servidor responde."""
    return {"estado": "ok", "tienda": "DIAMOND SHOP"}


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
