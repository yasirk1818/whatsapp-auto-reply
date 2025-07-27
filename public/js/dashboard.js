// public/js/dashboard.js
document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const qrContainer = document.getElementById('qrcode-container');
    const qrStatus = document.getElementById('qr-status');
    let currentSessionId = null;

    // "Scan QR" button par click ko sunein
    document.querySelectorAll('.scan-qr-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            currentSessionId = event.target.getAttribute('data-sessionid');
            qrContainer.innerHTML = 'Waiting for QR code...'; // Reset
            qrStatus.innerHTML = '';
            
            console.log(`Requesting QR for session: ${currentSessionId}`);
            socket.emit('create_session', { sessionId: currentSessionId });
        });
    });

    // Server se QR code receive karein
    socket.on('qr_code', (data) => {
        if (data.sessionId === currentSessionId) {
            console.log('QR code received from server');
            qrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data.qr)}" alt="QR Code">`;
        }
    });

    // Server se session ready ka signal receive karein
    socket.on('session_ready', (data) => {
        if (data.sessionId === currentSessionId) {
            console.log('Session is ready!');
            qrStatus.innerHTML = `<div class="alert alert-success">${data.message}</div>`;
            // 2 second baad page refresh karein taake status update ho jaye
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    });
});
