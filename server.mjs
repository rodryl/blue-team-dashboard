import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const PORT = 3000;

app.use(cors());

app.get('/api/vulns', async (req, res) => {
  const apiKey = 'dc42f707-7e2d-467f-9f7e-ed066c366245'; // Reemplazalo con tu API key si fuera necesario

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const startDate = threeDaysAgo.toISOString();
  const endDate = now.toISOString();

  const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=20&pubStartDate=${startDate}&pubEndDate=${endDate}`;

  try {
    const response = await fetch(url, {
      headers: {
        'apiKey': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`NIST API Error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data.vulnerabilities || []);
  } catch (err) {
    console.error('Error al obtener vulnerabilidades:', err);
    res.status(500).json({ error: 'Error al consultar vulnerabilidades.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor backend escuchando en http://localhost:${PORT}`);
});