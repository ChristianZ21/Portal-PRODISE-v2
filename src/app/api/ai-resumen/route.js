// src/app/api/ai-resumen/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    
    // El "Prompt del Sistema" define la personalidad de la IA (Nivel Ingeniería)
    const systemPrompt = `Eres un Superintendente de Confiabilidad y Mantenimiento de una Planta Minera. 
    Tu trabajo es leer la telemetría de desempeño de un trabajador y generar una síntesis ejecutiva de MÁXIMO 4 líneas.
    REGLAS DE TONO:
    1. Sé directo, analítico, crudo, estricto y objetivo (cruel con los malos datos, justo con la excelencia). Cero rodeos.
    2. Menciona la tendencia (si está mejorando o empeorando respecto a su histórico).
    3. Usa lenguaje de ingeniería (ej. "brecha de rendimiento", "desviación estándar", "sesgo hacia calidad").
    4. Destaca si es polivalente o si tiene un riesgo crítico en Seguridad o Precisión.`;

    const userPrompt = `Analiza a este técnico:
    - Nombre: ${body.nombre} (${body.cargo})
    - Nota Actual: ${body.notaActual} | Promedio Histórico: ${body.notaHist} | Delta: ${body.notaActual - body.notaHist}
    - Promedio de su Grupo: ${body.promedioGrupo}
    - Dimensiones: Seg: ${body.dims?.d1}, Calidad: ${body.dims?.d2}, Actitud: ${body.dims?.d3}, Precisión: ${body.dims?.d4}
    - Comentarios de los supervisores: ${body.comentarios.join(' | ')}
    
    Genera el diagnóstico.`;

    // Conexión a la API de OpenAI (ChatGPT)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Modelo rápido, económico y muy inteligente
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (!response.ok) throw new Error(data.error?.message || 'Error en API de OpenAI');

    return NextResponse.json({ resumen: data.choices[0].message.content });
  } catch (error) {
    console.error('Error IA:', error);
    return NextResponse.json({ resumen: 'No se pudo generar el análisis. Verifica la conexión o la OPENAI_API_KEY en tu archivo .env.local.' }, { status: 500 });
  }
}