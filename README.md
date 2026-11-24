# Macena Advogados · Central de atendimento

Protótipo (MVP) em React e Vite da assistente virtual e do painel interno do escritório.

```sh
npm install
npm run dev
```

Acesso de demonstração: usuário **paulo**, senha **123456**.

## Roteiro de apresentação

1. **Login**: entre com as credenciais acima.
2. **Visão geral**: casos que precisam de atenção, atendimentos fora do expediente, distribuição por área e como o fluxo funciona.
3. **Simular atendimento**: converse como cliente no "WhatsApp". Toque em um exemplo ou escreva livremente. A ficha ao lado se preenche sozinha. Experimente:
   - "Meu nome é Ana Souza, moro em Campinas e fui demitida. Tenho audiência amanhã" (a assistente não repete o que já foi dito e sinaliza o prazo);
   - um CPF inválido (ela pede para conferir) ou o botão "Gerar CPF fictício";
   - "vou ganhar?" (ela não promete resultados);
   - o clipe para anexar arquivos e o microfone para ditar (Chrome e Safari).
4. **Enviar para o painel da equipe**: o caso aparece com notificação, resumo, CPF mascarado e prazo destacado.
5. **Assumir atendimento**: a assistente é pausada e o advogado responde. Use também "Copiar resumo" e "Solicitar pelo WhatsApp" na aba Documentos.
6. **Clientes**, **Documentos** (pendentes e recebidos) e **Roadmap** (o que é demo e o que é produção).

Em **Ajuda** é possível restaurar os dados de exemplo.

## Limites da demonstração

Os dados ficam somente no navegador e o login é fictício. A triagem usa regras locais no lugar da IA. A integração com o WhatsApp, a IA generativa, a transcrição de áudios recebidos, o armazenamento seguro dos arquivos, a autenticação real e a integração processual ficam para a implementação de produção. Use apenas dados fictícios.
