const { Client, Buttons, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');

const client = new Client();

// Número do atendente
const numeroAtendente = '+5528999990862';

// Gera QR Code para autenticação
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

// Mensagem quando o bot está pronto
client.on('ready', () => {
    console.log('Bot está pronto!');
});

// Inicializa o cliente
client.initialize();

// Função para enviar todas as imagens da pasta e as opções do cardápio
async function enviarCardapio(chatId) {
    const pastaImagens = 'C:/Users/omega/Downloads/api/img'; // Caminho das imagens
    const imagens = fs.readdirSync(pastaImagens); // Lista de arquivos na pasta

    // Ordena as imagens em ordem alfabética (img1, img2, ...)
    imagens.sort();

    // Verifica se há imagens disponíveis
    if (imagens.length > 0) {
        // Cria uma mensagem para o cardápio
        let mensagemCardapio = 'Aqui estão as opções disponíveis:\n\n';

        // Envia as imagens uma por uma e constrói a mensagem do cardápio
        for (const imagem of imagens) {
            const caminhoImagem = path.join(pastaImagens, imagem);
            const media = MessageMedia.fromFilePath(caminhoImagem);
            await client.sendMessage(chatId, media);
            mensagemCardapio += `- ${imagem}\n`; // Adiciona o nome da imagem à mensagem
        }

        // Envia a mensagem do cardápio
        await client.sendMessage(chatId, mensagemCardapio);
    } else {
        await client.sendMessage(chatId, 'Nenhuma imagem encontrada na pasta.');
    }
}

// Função para enviar os botões de escolha após o envio do cardápio
async function enviarOpcoesPedido(chatId) {
    // Cria os botões para as opções: "Pizza", "Lanche", "Porção"
    const buttons = new Buttons(
        'Escolha o que você deseja pedir:',
        [
            { body: 'Pizza' },
            { body: 'Lanche' },
            { body: 'Porção' }
        ],
        'Selecione uma opção',
        'Clique em um dos botões'
    );

    // Envia os botões ao usuário
    await client.sendMessage(chatId, buttons);
}

// Armazena o estado dos pedidos
const estadosPedidos = {};

// Escuta as mensagens
client.on('message', async msg => {
    const chatId = msg.from;

    // Exibe a mensagem recebida no terminal
    console.log(`Mensagem recebida de ${chatId}: ${msg.body}`);

    // Se a pessoa mandar "oi"
    if (msg.body.toLowerCase() === 'oi') {
        // Envia mensagem de boas-vindas
        await client.sendMessage(chatId, 'Opa! Bora fazer o seu pedido? 🇧🇷🍔\n\nEscolha abaixo:');

        // Cria e envia os botões com as opções "Pedir agora" ou "Falar com o atendente"
        const buttons = new Buttons(
            'Link exclusivo, só para você:',
            [
                { body: 'Pedir agora' },
                { body: 'Falar com o atendente' }
            ],
            'Clique em um dos botões',
            'Selecione uma opção'
        );

        await client.sendMessage(chatId, buttons);
    }

    // Verifica se o usuário selecionou a opção de fazer pedido
    if (msg.body === 'Pedir agora') {
        await client.sendMessage(chatId, 'Você escolheu fazer o pedido! Aqui estão as opções disponíveis:');

        // Envia todas as imagens e o cardápio
        await enviarCardapio(chatId);

        // Após o envio do cardápio, envia os botões para escolher o tipo de produto
        await enviarOpcoesPedido(chatId);
    }

    // Verifica se o usuário selecionou "Falar com o atendente"
    if (msg.body === 'Falar com o atendente') {
        await client.sendMessage(chatId, 'Você escolheu Falar com o atendente. Um atendente estará disponível em breve.');

        // Envia uma mensagem ao atendente informando o número que precisa de atendimento
        const mensagemAtendente = `O cliente com o número ${chatId} precisa de atendimento.`;
        await client.sendMessage(numeroAtendente, mensagemAtendente);
    }

    // Verifica se o usuário escolheu "Pizza", "Lanche" ou "Porção" após o envio das imagens
    if (msg.body === 'Pizza') {
        await client.sendMessage(chatId, 'Você escolheu Pizza. Qual tamanho você deseja?\n1. Pequena\n2. Média\n3. Grande');
        estadosPedidos[chatId] = { item: 'Pizza', etapa: 'tamanho' };
    } else if (msg.body === 'Lanche' || msg.body === 'Porção') {
        await client.sendMessage(chatId, `Você escolheu ${msg.body}. Estamos processando seu pedido.`);
    }

    // Gerencia o fluxo de pedidos de pizza
    if (estadosPedidos[chatId]) {
        const estado = estadosPedidos[chatId];

        if (estado.item === 'Pizza') {
            if (estado.etapa === 'tamanho') {
                if (msg.body === '1' || msg.body === '2' || msg.body === '3') {
                    let tamanho;
                    if (msg.body === '1') tamanho = 'Pequena';
                    if (msg.body === '2') tamanho = 'Média';
                    if (msg.body === '3') tamanho = 'Grande';

                    estado.tamanho = tamanho;
                    estado.etapa = 'sabor';

                    await client.sendMessage(chatId, `Você escolheu uma pizza ${tamanho}. Agora, escolha o sabor:\n1. Calabresa\n2. Frango com Catupiry\n3. Margherita`);
                } else {
                    await client.sendMessage(chatId, 'Por favor, escolha um tamanho válido:\n1. Pequena\n2. Média\n3. Grande');
                }
            } else if (estado.etapa === 'sabor') {
                if (msg.body === '1' || msg.body === '2' || msg.body === '3') {
                    let sabor;
                    if (msg.body === '1') sabor = 'Calabresa';
                    if (msg.body === '2') sabor = 'Frango com Catupiry';
                    if (msg.body === '3') sabor = 'Margherita';

                    estado.sabor = sabor;
                    estado.etapa = 'quantidade';

                    await client.sendMessage(chatId, `Você escolheu o sabor ${sabor}. Quantas pizzas você deseja?`);
                } else {
                    await client.sendMessage(chatId, 'Por favor, escolha um sabor válido:\n1. Calabresa\n2. Frango com Catupiry\n3. Margherita');
                }
            } else if (estado.etapa === 'quantidade') {
                const quantidade = parseInt(msg.body);
                if (!isNaN(quantidade) && quantidade > 0) {
                    estado.quantidade = quantidade;

                    await client.sendMessage(chatId, `Pedido confirmado: ${quantidade} pizza(s) ${estado.tamanho} de sabor ${estado.sabor}. Estamos processando seu pedido.`);

                    // Limpa o estado do pedido após a confirmação
                    delete estadosPedidos[chatId];
                } else {
                    await client.sendMessage(chatId, 'Por favor, insira uma quantidade válida.');
                }
            }
        }
    }
});
