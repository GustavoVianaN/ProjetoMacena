import {useEffect, useMemo, useRef, useState} from 'react';
import {PLATFORM, analyze, guardrail, isGreeting, normalize, firstName, validCpf, formatCpf, validPhone, formatPhone, fakePhone, afterHours, questions, suggestedDocs, lawyers, route} from './data';

// Cada canal muda o tom da conversa e quais dados são pedidos.
export const channelScripts = {
  jusponte: {
    welcome: `Olá! Que bom que você chegou ao ${PLATFORM}. 😊\n\nConte com suas palavras o que aconteceu. Eu entendo o seu caso e conecto você com um advogado especialista. Não precisa usar termos jurídicos.\n\nSou uma assistente virtual e suas informações são sigilosas, conforme a LGPD.`,
    askPhone: true, askCpf: false, national: true,
  },
  site: {
    welcome: 'Olá! Você está no atendimento online do Macena Advogados. 😊\n\nMe conte o que aconteceu. Eu organizo as informações e direciono você para o Dr. Paulo, o Dr. Luiz ou o Dr. Nick, conforme a especialidade.\n\nSou a assistente virtual do escritório e suas informações são sigilosas, conforme a LGPD.',
    askPhone: true, askCpf: false, national: false,
  },
  whatsapp: {
    welcome: 'Olá! Seja muito bem-vindo ao Macena Advogados. 😊\n\nSou a assistente virtual do Dr. Paulo. Enquanto ele não pode responder, vou adiantar seu atendimento. Fique à vontade para me contar o que aconteceu. Pode escrever ou mandar áudio.\n\nSuas informações são sigilosas e usadas apenas pelo escritório, conforme a LGPD.',
    askPhone: false, askCpf: true, national: false,
  },
};

function steps(area, script) {
  return [
    {key: 'name', label: 'Nome completo',
      ask: c => c.firstName ? `Prazer, ${c.firstName}! Pode me passar seu nome completo?` : 'Para registrar seu atendimento, qual é o seu nome completo?',
      check: value => value.trim().split(/\s+/).length >= 2 || 'Pode me informar o nome completo, com sobrenome?'},
    ...(script.askPhone ? [{key: 'phone', label: 'WhatsApp',
      ask: c => `Obrigada, ${firstName(c.name)}. Qual é o seu WhatsApp com DDD? É por lá que o advogado vai continuar a conversa.`,
      check: value => validPhone(value) || 'Esse número parece incompleto. Pode enviar com DDD, por exemplo (11) 91234-5678?', format: formatPhone}] : []),
    ...(script.askCpf ? [{key: 'cpf', label: 'CPF',
      ask: c => `Obrigada, ${firstName(c.name)}. Agora preciso do seu CPF. Ele fica protegido e só o escritório tem acesso.`,
      check: value => validCpf(value) || 'Esse CPF não parece válido. Pode conferir os 11 números?', format: formatCpf}] : []),
    {key: 'city', label: 'Cidade', ask: () => script.national ? 'Em qual cidade e estado você mora?' : 'Em qual cidade você mora?'},
    {key: 'process', label: 'Já existe processo?', ask: () => 'Já existe algum processo na Justiça sobre essa situação?'},
    {key: 'deadline', label: 'Prazo ou urgência', ask: () => 'Existe alguma audiência, prazo ou urgência? Se não houver, pode responder "não".'},
    ...(questions[area] || []).map(([label, question]) => ({key: label, label, ask: () => question})),
    {key: 'docs', label: 'Documentos',
      ask: () => `Para adiantar, se tiver em mãos, pode enviar foto ou PDF de:\n• ${suggestedDocs(area).join('\n• ')}\n\nUse o clipe aqui embaixo. Se preferir mandar depois, é só responder "depois".`},
  ];
}
const noUrgency = /^(n[aã]o|nenhum|nenhuma|nada|sem )/i;

export function useConversation(channel, onComplete) {
  const script = channelScripts[channel];
  const [phone] = useState(() => channel === 'whatsapp' ? fakePhone() : '');
  const [messages, setMessages] = useState(() => [{role: 'assistant', text: script.welcome, at: Date.now()}]);
  const [typing, setTyping] = useState(false);
  const [info, setInfo] = useState(null);
  const [answers, setAnswers] = useState({});
  const [docs, setDocs] = useState([]);
  const [saved, setSaved] = useState(false);
  const timer = useRef(null);
  const list = useMemo(() => steps(info?.area, script), [info?.area, script]);
  const step = info && list.find(item => !(item.key in answers));
  const done = !!info && !step;
  const lawyer = info ? lawyers[info.lawyer] : null;

  useEffect(() => () => clearTimeout(timer.current), []);
  // Ao terminar a triagem, o caso entra no painel do escritório.
  useEffect(() => {
    if (!done || typing || saved) return;
    setSaved(true);
    const {name, cpf, phone: typedPhone, city, process, deadline, docs: _docs, ...rest} = answers;
    onComplete?.({
      channel, lawyer: info.lawyer, name, cpf, phone: typedPhone || phone, city, area: info.area, subject: info.subject, report: info.report,
      urgent: !!info.urgent, deadline: info.urgent ? deadline : '',
      answers: [['Já existe processo?', process], ['Prazo ou urgência', deadline], ...Object.entries(rest)].filter(([, value]) => value),
      docs, messages, createdAt: Date.now(),
    });
  }, [done, typing, saved]); // eslint-disable-line react-hooks/exhaustive-deps

  function reply(...items) {
    setTyping(true);
    clearTimeout(timer.current);
    const length = items.map(item => typeof item === 'string' ? item : '').join(' ').length;
    timer.current = setTimeout(() => {
      setTyping(false);
      setMessages(previous => [...previous, ...items.filter(Boolean).map(item => typeof item === 'string' ? {role: 'assistant', text: item, at: Date.now()} : {...item, at: Date.now()})]);
    }, 650 + Math.min(length * 6, 900));
  }
  const context = (extra = {}) => ({...answers, ...extra, firstName: info?.firstName});

  function introduce(found, next) {
    const target = lawyers[next.lawyer];
    if (!found.area) return 'Obrigada por me explicar. Vou registrar seu relato para que a equipe avalie qual especialista atende melhor o seu caso. Antes, algumas perguntas rápidas.';
    const area = `${found.area} (${found.subject.toLowerCase()})`;
    if (next.lawyer === 'parceiros') {
      return channel === 'jusponte'
        ? `Entendi. Pelo que você contou, é um caso de ${area}. Vou encaminhar para um advogado parceiro da nossa rede, especialista no assunto. Antes, algumas perguntas rápidas.`
        : `Entendi. Pelo que você contou, é um caso de ${area}. Esse assunto não é uma especialidade do escritório, mas podemos indicar um advogado parceiro de confiança. Antes, algumas perguntas rápidas.`;
    }
    return `Entendi${next.firstName ? ', ' + next.firstName : ''}. Pelo que você contou, é um caso de ${area}. Vou conectar você com o ${target.name}, especialista em ${target.title}. Sou a assistente dele e vou adiantar algumas informações para que ele já receba seu caso organizado.`;
  }

  function send(raw, extra = {}) {
    const value = raw.trim();
    if (!value || typing || done) return;
    setMessages(previous => [...previous, {role: 'client', text: value, at: Date.now(), ...extra}]);

    if (!info) {
      if (isGreeting(value)) return reply('Olá! Que bom falar com você. 😊 Pode me contar, com suas palavras, o que aconteceu?');
      const found = analyze(value);
      const prefilled = {};
      if (found.name.split(' ').length >= 2) prefilled.name = found.name;
      if (found.city) prefilled.city = found.city;
      if (found.process) prefilled.process = found.process;
      if (found.urgent) prefilled.deadline = found.deadline;
      const area = found.area || 'A classificar';
      const next = {report: value, area, subject: found.subject || 'A definir pela equipe', urgent: found.urgent, firstName: firstName(found.name), lawyer: route(area)};
      setInfo(next);
      setAnswers(prefilled);
      const nextStep = steps(area, script).find(item => !(item.key in prefilled));
      return reply(
        [introduce(found, next),
          found.urgent && `Anotei que existe uma urgência ("${found.deadline}") e vou sinalizar isso como prioridade.`,
          found.city && `Já anotei que você mora em ${found.city}.`].filter(Boolean).join('\n\n'),
        found.area && {role: 'handoff', lawyer: next.lawyer},
        nextStep.ask({...prefilled, firstName: next.firstName}),
      );
    }

    if (guardrail.test(normalize(value))) {
      return reply(`Boa pergunta! Eu sou a assistente virtual e organizo seu caso. Quem avalia as chances, os valores e dá a orientação jurídica é ${lawyer.short === 'um advogado parceiro' ? 'o advogado' : 'o ' + lawyer.short}, depois de analisar seu caso e os documentos. Por isso não posso prometer resultados.`, step.ask(context()));
    }
    const valid = step.check ? step.check(value) : true;
    if (valid !== true) return reply(valid);
    const updated = {...answers, [step.key]: step.format ? step.format(value) : value};
    setAnswers(updated);
    if (step.key === 'deadline' && !noUrgency.test(value)) setInfo(current => ({...current, urgent: true}));
    const following = list.find(item => !(item.key in updated));
    reply(following ? following.ask(context(updated)) : closing(updated));
  }

  function closing(values) {
    const late = afterHours(Date.now());
    const who = lawyer.short === 'um advogado parceiro' ? 'Um advogado parceiro' : 'O ' + lawyer.short;
    const where = channel === 'whatsapp' ? 'por aqui' : `pelo WhatsApp ${values.phone}`;
    return `Pronto, ${firstName(values.name)}! Já organizei tudo. ${who} vai continuar seu atendimento ${where}${late ? '. Como estamos fora do horário comercial, o retorno será no próximo dia útil' : ' o quanto antes'}. Obrigada pela confiança!`;
  }

  function attach(files) {
    const names = Array.from(files, file => file.name).filter(name => !docs.includes(name));
    if (!names.length || typing || done) return;
    setDocs(current => [...current, ...names]);
    setMessages(previous => [...previous, ...names.map(name => ({role: 'client', text: name, file: true, at: Date.now()}))]);
    if (step?.key === 'docs') {
      const updated = {...answers, docs: 'Enviados'};
      setAnswers(updated);
      reply('Recebi, obrigada! Os arquivos já ficam anexados ao seu atendimento.', closing(updated));
    } else reply('Recebi o arquivo, obrigada! Ele já fica anexado ao seu atendimento.' + (step ? '\n\n' + step.ask(context()) : ''));
  }

  const progress = info ? Math.round(Object.keys(answers).length / list.length * 100) : 0;
  return {messages, typing, info, answers, docs, step, done, saved, lawyer, phone, progress, send, attach};
}
