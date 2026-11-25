# Macena Advogados · JusPonte

Protótipo (MVP) das três frentes de atendimento pedidas pelo Dr. Paulo, todas ligadas a um único painel:

1. **JusPonte**: plataforma nacional de captação, sem a marca do escritório, para quem procura advogado no Google. A assistente entende o caso e encaminha ao especialista: cível, família e previdenciário → Dr. Paulo; trabalhista → Dr. Luiz; penal → Dr. Nick; outras áreas → rede de parceiros.
2. **Site Macena**: site do escritório com bate-papo. O cliente sabe que vai falar com o Dr. Paulo, o Dr. Luiz ou o Dr. Nick.
3. **WhatsApp**: secretária virtual que adianta o atendimento até o Dr. Paulo responder.

```sh
npm install
npm run dev
```

Para abrir no celular, use `npm run dev -- --host` e acesse pelo IP do computador.

## Roteiro de apresentação

A barra escura no topo alterna entre as quatro telas.

1. **JusPonte**: toque em "advogado criminal urgente" nas buscas frequentes. O chat identifica Direito Penal, apresenta o Dr. Nick e o cabeçalho passa a mostrar "Dr. Nick · Assistente virtual". Responda as perguntas (há botão de telefone fictício). Pergunte "você é advogado?" ou "vou ganhar?" para ver a resposta transparente. Teste também "O banco me cobrou indevidamente", que vai para a rede de parceiros.
2. **Site Macena**: "Conversar agora" e "Fui demitido e não recebi a rescisão" → Dr. Luiz.
3. **WhatsApp**: converse como cliente. Ao lado aparece a ficha que o escritório recebe.
4. **Painel**: os casos chegam com notificação, canal de origem e advogado responsável. Dá para transferir entre advogados, assumir, responder, pedir documentos e copiar o resumo. A Visão geral mostra casos por canal, por advogado e por estado. O Roadmap traz a ordem sugerida de lançamento e os cuidados com a OAB.

Em **Ajuda**, no painel, é possível restaurar os dados de exemplo.

## Limites da demonstração

Os nomes dos advogados e da plataforma são provisórios. A triagem usa regras locais no lugar da IA, os dados ficam somente no navegador e não há login. A integração com o WhatsApp, a IA generativa, a transcrição de áudios recebidos, o armazenamento seguro de arquivos, o domínio e SEO dos sites e a rede de parceiros ficam para a produção. Use apenas dados fictícios.
