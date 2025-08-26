// routes/verification.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../handlers/verificationHandler');
const { verifyOwner } = require('../handlers/ownerHandler');

// Serve verification page
router.get('/verify', (req, res) => {
    const { token, number } = req.query;
    
    if (!token || !number) {
        return res.status(400).send('Token atau nomor tidak valid');
    }
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Verifikasi Owner - Tohang Store</title>
            <style>
                body { font-family: Arial, sans-serif; background: #f0f2f5; margin: 0; padding: 20px; }
                .container { max-width: 400px; margin: 50px auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h1 { color: #25D366; text-align: center; }
                .form-group { margin-bottom: 20px; }
                label { display: block; margin-bottom: 5px; font-weight: bold; }
                input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px; }
                button { width: 100%; padding: 12px; background: #25D366; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; }
                button:hover { background: #128C7E; }
                .success { background: #4CAF50; color: white; padding: 10px; border-radius: 5px; }
                .error { background: #f44336; color: white; padding: 10px; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🔐 Verifikasi Owner</h1>
                <p>Nomor: ${number}</p>
                
                <form id="verificationForm">
                    <div class="form-group">
                        <label for="password">Password:</label>
                        <input type="password" id="password" name="password" required placeholder="Masukkan password owner">
                    </div>
                    <button type="submit">Verifikasi</button>
                </form>
                
                <div id="result" style="display: none; margin-top: 20px;"></div>
            </div>

            <script>
                document.getElementById('verificationForm').addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const password = document.getElementById('password').value;
                    const resultDiv = document.getElementById('result');
                    
                    try {
                        const response = await fetch('/verify-submit', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                token: '${token}',
                                number: '${number}',
                                password: password
                            })
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                            resultDiv.innerHTML = '<div class="success">✅ ' + data.message + '</div>';
                        } else {
                            resultDiv.innerHTML = '<div class="error">❌ ' + data.message + '</div>';
                        }
                    } catch (error) {
                        resultDiv.innerHTML = '<div class="error">❌ Terjadi kesalahan: ' + error.message + '</div>';
                    }
                    
                    resultDiv.style.display = 'block';
                });
            </script>
        </body>
        </html>
    `);
});

// Handle verification submission
router.post('/verify-submit', async (req, res) => {
    const { token, number, password } = req.body;
    
    try {
        const verifiedNumber = verifyToken(token, password);
        
        if (verifiedNumber) {
            // Verifikasi sukses, simpan sebagai owner
            verifyOwner(verifiedNumber + '@s.whatsapp.net');
            
            res.json({
                success: true,
                message: 'Verifikasi berhasil! Anda sekarang adalah owner. Kembali ke WhatsApp untuk menggunakan fitur owner.'
            });
        } else {
            res.json({
                success: false,
                message: 'Password salah atau token expired!'
            });
        }
    } catch (error) {
        res.json({
            success: false,
            message: 'Terjadi kesalahan sistem: ' + error.message
        });
    }
});

module.exports = router;
