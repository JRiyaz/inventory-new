#!/bin/sh
set -e

# Path to load balancer configuration
CONF_DIR="/usr/local/apache2/conf/extra"
CONF_FILE="${CONF_DIR}/proxy-balancer.conf"

mkdir -p "${CONF_DIR}"

# Standardize boolean checks
ENABLE_LOWER=$(echo "${ENABLE_APACHE}" | tr '[:upper:]' '[:lower:]')

if [ "${ENABLE_LOWER}" = "true" ]; then
    echo "[Apache Entrypoint] 2FA/Monolith Load Balancer: ENABLED"
    echo "[Apache Entrypoint] Mapping all incoming port 80 traffic to backend balancer members."

    # Create load balancer configuration supporting standard HTTP and WebSockets (ws://)
    cat <<EOF > "${CONF_FILE}"
<Proxy balancer://mycluster>
    BalancerMember http://backend:3000
    ProxySet lbmethod=byrequests
</Proxy>

<Proxy balancer://wscluster>
    BalancerMember ws://backend:3000
</Proxy>

# Proxy WebSocket connections (e.g. for the collaborative chat features)
ProxyPass /api/chat/ws balancer://wscluster/api/chat/ws
ProxyPassReverse /api/chat/ws balancer://wscluster/api/chat/ws

# General Web/API traffic proxying
ProxyPass / balancer://mycluster/
ProxyPassReverse / balancer://mycluster/
EOF

else
    echo "[Apache Entrypoint] 2FA/Monolith Load Balancer: DISABLED"
    echo "[Apache Entrypoint] Bypassing reverse proxy routing. Standard placeholder page active."

    # Clear active proxying configuration
    echo "# Load Balancer is disabled in environment" > "${CONF_FILE}"

    # Generate a gorgeous placeholder page explaining how to connect directly or enable Apache
    cat <<EOF > "/usr/local/apache2/htdocs/index.html"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apache Gateway - Deactivated</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: radial-gradient(circle at 15% 15%, #111333 0%, #060714 100%);
            color: #ffffff;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            overflow: hidden;
        }
        .card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(12px);
            border-radius: 24px;
            padding: 3rem;
            max-width: 480px;
            text-align: center;
            box-shadow: 0 20px 50px rgba(0,0,0,0.4);
            animation: fadeIn 1s ease-out;
        }
        h1 {
            font-size: 1.8rem;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #a855f7, #6d74ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        p {
            font-size: 0.9rem;
            color: #94a3b8;
            line-height: 1.6;
            margin-bottom: 2rem;
        }
        .badge {
            display: inline-block;
            background: rgba(244, 63, 94, 0.15);
            border: 1px solid rgba(244, 63, 94, 0.3);
            color: #f43f5e;
            font-size: 0.75rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            padding: 0.4rem 1rem;
            border-radius: 12px;
            margin-bottom: 1.5rem;
        }
        .instruction {
            background: rgba(255,255,255,0.02);
            border-radius: 12px;
            padding: 1rem;
            font-family: monospace;
            font-size: 0.8rem;
            color: #cbd5e1;
            border-left: 3px solid #6d74ff;
            text-align: left;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="badge">Gateway Inactive</div>
        <h1>Apache Load Balancer</h1>
        <p>The Apache reverse proxy gateway is currently bypassed. You can access the unified Monolith system directly on port 3000, or enable the gateway in your configurations.</p>
        <div class="instruction">
            # To activate the Apache balancer, set:<br>
            ENABLE_APACHE=true<br>
            # in your local .env configuration file!
        </div>
    </div>
</body>
</html>
EOF
fi

# Run Apache daemon in the foreground
echo "[Apache Entrypoint] Starting HTTPD server daemon..."
exec httpd -D FOREGROUND
