import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyCy-BBGEgB5GZy5ysgir4pTUtjj7RrB9Ok');

async function test() {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(['Hello, are you working?']);
        console.log("Success:", result.response.text());
    } catch (e: any) {
        console.error("Failure:", JSON.stringify(e, Object.getOwnPropertyNames(e)));
    }
}

test();
