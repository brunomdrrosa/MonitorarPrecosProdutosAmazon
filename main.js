const axios = require('axios');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');
require('dotenv').config();

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const recipientEmail = process.env.RECIPIENT_EMAIL;

// URLs dos produtos
const products = [
  { 
    url: 'https://www.amazon.com.br/Blurryface-Twenty-One-Pilots/dp/B010T34MLU/ref=tmm_vnl_swatch_0?_encoding=UTF8&dib_tag=se&dib=eyJ2IjoiMSJ9.QdnqTUCc8B9kCw_XEJgKeCWDZfsAsYHY0jps0jYs6eUGN-6viPb7phBz6NekRiVfC1kzk2f2SS4oJSxko-0jHJ18Y5DRnD-gBgmQYLAHHEE0prToA-cMzkccYQLQA7kK-OP9CWH79A2P-BkIvq2fT0eez9dUHIdk6EGr3V-D5DYVfDM-Gf89tru3y9EFNZJ3PYxepcFh6r9n7sXaBvKFaEmmWr_SDz0quPrA0JIjtn-_RpvWgiIT3dYDWIgb0XBm15NEp804y60Rn23ZhGAbCqjW1arDZDq5T-CY6UjLkRY.-TukwMGOpAS5ifQgUHNTMaC1Ai42seWr85foJBwNZ1o&qid=1721080786&sr=8-1',
    name: 'Blurryface',
    threshold: 700
  },
  { 
    url: 'https://www.amazon.com.br/Trench-twenty-one-pilots/dp/B07GRM216X/ref=sr_1_1?__mk_pt_BR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=2WZ34VDGANLQM&dib=eyJ2IjoiMSJ9.gTB2XnJrcmHRdoBwqo4SAdJ62auc1QR62MexgcSRWfI9FoABmEiPINRANYEIlGDEqJNAwvFjnfwgf6g15F4nFxPW-EpV7kif8_-S2-0zSZbMwLtavSLRs50VPfDtOjKR8LCjwE-l0d6-IyrRrm2oaolLD2o-3vRR1z4FpS-zXiH2_7EjXfATDEx-mvpqyw7JM4iLmuMbFafNdYmi-etZO52YoL5ee47gfzQNCPswenoEJ0vqimL9D76ZTbliYMvu6YF55a74A6Jf2ypuqsQXrK-KG7Yxk3R180VHSn23Jnw.tnFdgKfRjYYX0FapbYlUh7d1LlbgC-qY1kXPkr1N57s&dib_tag=se&keywords=vinil+trench&qid=1721082095&sprefix=vinil+trench%2Caps%2C252&sr=8-1',
    name: 'Trench',
    threshold: 300
  },
  { 
    url: 'https://www.amazon.com.br/Scaled-Disco-Vinil-twenty-pilots/dp/B09BNWNQ49/ref=sr_1_1?__mk_pt_BR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=3TOSAW9W59YE7&dib=eyJ2IjoiMSJ9.gprJXHKfeLWQDpKoEQx1pIsSFHbWMPflipJTq5z-JDbOItUIozqJzUM0Te30bwvTpMC-K6Grkvc_vsGTZ4bX1NvTHeqrHePH3CmUKwJ0QuoWrBk5MONKFluJN-g4c1nrEEqPGRrIfSatKEmH6XVPKMyBVDxhBYil-nYCDGam3R6uLVU1wqnSO_Th6zhnPyyX.uxjJReUjz2CZOO47BwC4-Va9WkJMY1Kl857b5w0IqYE&dib_tag=se&keywords=vinil+scaled+and+icy&qid=1721082106&sprefix=vinil+scaled+and+icy%2Caps%2C206&sr=8-1',
    name: 'Scaled and Icy',
    threshold: 300
  }
];

// Cabeçalhos para simular um navegador
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
};

// Função para buscar o preço do produto na Amazon
async function getPrice(url) {
  try {
    const { data } = await axios.get(url, { headers });
    const $ = cheerio.load(data);

    const title = $('#productTitle').text().trim();
    const price = $('.a-price-whole').first().text().replace('.', '').replace(',', ''); // Formatar preço
    console.log(`Title: ${title}`);
    console.log(`Price: ${price}`);

    const numPrice = parseFloat(price);

    return { title, numPrice, url };
  } catch (error) {
    console.error(error);
    return null;
  }
}

// Função para enviar um email de alerta
async function sendEmail(productTitle, price, url) {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });

  let mailOptions = {
    from: emailUser,
    to: recipientEmail,
    subject: 'O valor do produto abaixou!',
    text: `O valor do produto ${productTitle} abaixou para R$${price}. Confira o produto aqui: ${url}`
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log('Email enviado: ' + info.response);
  } catch (error) {
    console.error(error);
  }
}

// Função principal para monitorar os preços
async function monitorPrices() {
  for (const product of products) {
    const result = await getPrice(product.url);
    if (result && result.numPrice < product.threshold) {
      await sendEmail(result.title, result.numPrice, result.url);
    }
  }
}

// Executar a função de monitoramento
monitorPrices();