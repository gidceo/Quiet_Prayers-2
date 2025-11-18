import { Prayer } from "@shared/schema";
import html2canvas from "html2canvas";

export async function generatePrayerCardImage(prayer: Prayer): Promise<string> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '600px';
  container.style.height = '750px';
  
  container.innerHTML = `
    <div style="
      width: 600px;
      height: 750px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 60px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: center;
      font-family: Georgia, serif;
      position: relative;
    ">
      <div style="
        background: rgba(255, 255, 255, 0.95);
        border-radius: 20px;
        padding: 50px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
      ">
        <p style="
          font-size: 24px;
          line-height: 1.6;
          color: #1a202c;
          text-align: center;
          margin: 0 0 30px 0;
          max-height: 500px;
          overflow: hidden;
        ">
          "${prayer.content.length > 300 ? prayer.content.substring(0, 300) + '...' : prayer.content}"
        </p>
        
        <div style="
          text-align: center;
          font-size: 16px;
          color: #718096;
          margin-top: auto;
        ">
          ${prayer.isAnonymous || !prayer.authorName 
            ? '<span style="font-style: italic;">Anonymous</span>' 
            : `<span style="font-weight: 600;">— ${prayer.authorName}</span>`
          }
        </div>
      </div>
      
      <div style="
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        color: white;
        font-size: 14px;
        font-family: Arial, sans-serif;
        opacity: 0.8;
      ">
        QuietPrayers
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
      backgroundColor: null,
      scale: 2,
      logging: false,
    });

    const dataUrl = canvas.toDataURL('image/png');
    return dataUrl;
  } finally {
    document.body.removeChild(container);
  }
}
