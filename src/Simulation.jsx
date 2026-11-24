import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Scale, Send, Paperclip, Mic, RotateCcw, FileText, CheckCheck, TriangleAlert, Sparkles, ShieldCheck, ArrowRight} from 'lucide-react';
import {analyze, guardrail, isGreeting, normalize, firstName, validCpf, formatCpf, maskCpf, fakeCpf, fakePhone, afterHours, questions, suggestedDocs, welcome, examples, clock} from './data';

const Recognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

function steps(area) {
  return [
    {key: 'name', label: 'Nome completo',
      ask: c => c.firstName ? `Prazer, ${c.firstName}! Para o cadastro, pode me passar seu nome completo?` : 'Para eu registrar seu atendimento, qual é o seu nome completo?',
      check: value => value.trim().split(/\s+/).length >= 2 || 'Pode me informar o nome completo, com sobrenome? Assim a equipe encontra seu cadastro com facilidade.'},
    {key: 'cpf', label: 'CPF',
      ask: c => `Obrigada, ${firstName(c.name)}. Agora preciso do seu CPF. Ele fica protegido e só a equipe do escritório tem acesso.`,
      check: value => validCpf(value) || 'Esse CPF não parece válido. Pode conferir os 11 números?', format: formatCpf},
    {key: 'city', label: 'Cidade', ask: () => 'Em qual cidade você mora?'},
    {key: 'process', label: 'Já existe processo?', ask: () => 'Já existe algum processo na Justiça sobre essa situação?'},
    {key: 'deadline', label: 'Prazo ou urgência', ask: () => 'Existe alguma audiência, prazo ou urgência? Se não houver, pode responder "não".'},
    ...(questions[area] || []).map(([label, question]) => ({key: label, label, ask: () => question})),
    {key: 'docs', label: 'Documentos',
      ask: () => `Para adiantar, se tiver em mãos, pode enviar foto ou PDF de:\n• ${suggestedDocs(area).join('\n• ')}\n\nUse o clipe aqui embaixo. Se preferir mandar depois, é só responder "depois".`},
  ];
}
const noUrgency = /^(n[aã]o|nenhum|nenhuma|nada|sem )/i;

export default function Simulation({onSave}) {
  const [session, setSession] = useState(0);
  return <Conversation key={session} onSave={onSave} onRestart={() => setSession(value => value + 1)}/>;
}

function Conversation({onSave, onRestart}) {
  const [phone] = useState(fakePhone);
  const [messages, setMessages] = useState(() => [{role: 'assistant', text: welcome, at: Date.now()}]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [info, setInfo] = useState(null);
  const [answers, setAnswers] = useState({});
  const [docs, setDocs] = useState([]);
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState('');
  const log = useRef(null);
  const timer = useRef(null);
  const list = useMemo(() => steps(info?.area), [info?.area]);
  const step = info && list.find(item => !(item.key in answers));
  const done = !!info && !step;

  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight; }, [messages, typing]);
  useEffect(() => () => clearTimeout(timer.current), []);

  function reply(...texts) {
    setTyping(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setTyping(false);
      setMessages(previous => [...previous, ...texts.filter(Boolean).map(text => ({role: 'assistant', text, at: Date.now()}))]);
    }, 650 + Math.min(texts.join(' ').length * 6, 900));
  }
  const context = (extra = {}) => ({...answers, ...extra, firstName: info?.firstName || extra.firstName});

  function send(raw, extra = {}) {
    const value = raw.trim();
    if (!value || typing || done) return;
    setMessages(previous => [...previous, {role: 'client', text: value, at: Date.now(), ...extra}]);
    setInput('');

    if (!info) {
      if (isGreeting(value)) return reply('Olá! Que bom falar com você. 😊 Pode me contar, com suas palavras, o que aconteceu? Não precisa usar termos jurídicos.');
      const found = analyze(value);
      const prefilled = {};
      if (found.name.split(' ').length >= 2) prefilled.name = found.name;
      if (found.city) prefilled.city = found.city;
      if (found.process) prefilled.process = found.process;
      if (found.urgent) prefilled.deadline = found.deadline;
      const next = {report: value, area: found.area || 'A classificar', subject: found.subject || 'A definir pela equipe', urgent: found.urgent, firstName: firstName(found.name)};
      setInfo(next);
      setAnswers(prefilled);
      const nextStep = steps(next.area).find(item => !(item.key in prefilled));
      return reply(
        [found.area
          ? `Entendi${next.firstName ? ', ' + next.firstName : ''}. Pelo que você contou, parece ser um caso de ${found.area} (${found.subject.toLowerCase()}). Vou fazer algumas perguntas rápidas para que a equipe já receba tudo organizado.`
          : 'Obrigada por me explicar. Vou registrar seu relato para a equipe avaliar qual advogado atende melhor o seu caso. Antes, algumas perguntas rápidas.',
        found.urgent && `Anotei que existe uma urgência ("${found.deadline}") e vou sinalizar isso como prioridade.`,
        found.city && `Já anotei que você mora em ${found.city}.`].filter(Boolean).join('\n\n'),
        nextStep.ask({...prefilled, firstName: next.firstName}),
      );
    }

    if (guardrail.test(normalize(value))) {
      return reply('Entendo sua preocupação. Quem avalia as chances e os valores é o advogado, depois de analisar seu caso e os documentos. Eu não posso prometer resultados, mas posso deixar tudo organizado para ele.', step.ask(context()));
    }
    const valid = step.check ? step.check(value) : true;
    if (valid !== true) return reply(valid);
    const stored = step.format ? step.format(value) : value;
    const updated = {...answers, [step.key]: stored};
    setAnswers(updated);
    if (step.key === 'deadline' && !noUrgency.test(value)) setInfo(current => ({...current, urgent: true}));
    const following = list.find(item => !(item.key in updated));
    reply(following ? following.ask(context(updated)) : closing(updated.name));
  }

  function closing(name) {
    const late = afterHours(Date.now());
    return `Pronto, ${firstName(name)}! Já organizei tudo. Um advogado do Macena Advogados vai continuar seu atendimento por aqui${late ? '. Como estamos fora do horário de expediente, o retorno será no próximo dia útil' : ' o quanto antes'}. Obrigada pela confiança!`;
  }

  function attach(files) {
    const names = Array.from(files, file => file.name).filter(name => !docs.includes(name));
    if (!names.length || typing) return;
    setDocs(list => [...list, ...names]);
    setMessages(previous => [...previous, ...names.map(name => ({role: 'client', text: name, file: true, at: Date.now()}))]);
    if (step?.key === 'docs') {
      const updated = {...answers, docs: 'Enviados'};
      setAnswers(updated);
      reply('Recebi, obrigada! Os arquivos já ficam anexados ao seu atendimento.', closing(updated.name));
    } else reply('Recebi o arquivo, obrigada! Ele já fica anexado ao seu atendimento.' + (step ? '\n\n' + step.ask(context()) : ''));
  }

  function listen() {
    if (!Recognition) return setNotice('Este navegador não permite ditado por voz. Na versão com WhatsApp, os áudios do cliente serão transcritos automaticamente.');
    const recognition = new Recognition();
    recognition.lang = 'pt-BR';
    recognition.onresult = event => send(event.results[0][0].transcript, {audio: true});
    recognition.onerror = () => setNotice('Não consegui ouvir o áudio. Verifique a permissão do microfone.');
    recognition.onend = () => setListening(false);
    setNotice('');
    setListening(true);
    recognition.start();
  }

  function finish() {
    const {name, cpf, city, process, deadline, docs: _docs, ...rest} = answers;
    onSave({
      name, cpf, phone, city, area: info.area, subject: info.subject, report: info.report,
      urgent: !!info.urgent, deadline: info.urgent ? deadline : '',
      answers: [['Já existe processo?', process], ['Prazo ou urgência', deadline], ...Object.entries(rest)].filter(([, value]) => value),
      docs, messages, createdAt: Date.now(),
    });
  }

  const fields = [
    ['Área jurídica', info?.area], ['Assunto', info?.subject], ['Nome completo', answers.name], ['CPF', answers.cpf && maskCpf(answers.cpf)],
    ['Telefone (WhatsApp)', phone], ['Cidade', answers.city], ['Já existe processo?', answers.process],
    ...(questions[info?.area] || []).map(([label]) => [label, answers[label]]),
  ];
  const progress = info ? Math.round(Object.keys(answers).length / list.length * 100) : 0;

  return <>
    <div className="heading"><div><h1>Simular atendimento</h1><p>Veja a conversa do ponto de vista do cliente no WhatsApp. Use apenas dados fictícios.</p></div>
      <button className="secondary" onClick={onRestart}><RotateCcw size={16}/> Nova conversa</button></div>
    <section className="simulation">
      <div className="phone">
        <header className="waHead"><span className="waAvatar"><Scale size={18}/></span><div><strong>Macena Advogados</strong><small>{typing ? 'digitando…' : 'online'}</small></div></header>
        <div className="waLog" ref={log} role="log" aria-label="Conversa simulada">
          <span className="waDay">Hoje</span>
          <span className="waLock"><ShieldCheck size={13}/> Conversa protegida. Dados usados somente pelo escritório.</span>
          {messages.map((message, index) => <div key={index} className={'wa ' + message.role}>
            {message.audio && <small className="waAudio"><Mic size={12}/> Áudio transcrito</small>}
            {message.file ? <span className="waFile"><FileText size={18}/>{message.text}</span> : <p>{message.text}</p>}
            <time>{clock(message.at)}{message.role === 'client' && <CheckCheck size={14}/>}</time>
          </div>)}
          {typing && <div className="wa assistant waTyping" aria-label="Assistente digitando"><i/><i/><i/></div>}
        </div>
        {!info && !typing && messages.length === 1 && <div className="chips">{examples.map(text => <button key={text} onClick={() => send(text)}>{text}</button>)}</div>}
        {step?.key === 'cpf' && !typing && <div className="chips"><button onClick={() => setInput(fakeCpf())}>Gerar CPF fictício</button></div>}
        {notice && <p className="waNotice" role="status">{notice}</p>}
        {done && !typing ? <div className="waDone"><button className="primary" onClick={finish}>Enviar para o painel da equipe <ArrowRight size={17}/></button><small>Na produção, este envio acontece automaticamente.</small></div>
          : <form className="waCompose" onSubmit={event => { event.preventDefault(); send(input); }}>
            <label className="waAttach" title="Enviar arquivo"><Paperclip size={20}/><input type="file" multiple aria-label="Enviar arquivos fictícios" onChange={event => { attach(event.target.files); event.target.value = ''; }}/></label>
            <input value={input} onChange={event => setInput(event.target.value)} placeholder="Mensagem" aria-label="Sua mensagem" inputMode={step?.key === 'cpf' ? 'numeric' : 'text'}/>
            {input.trim() ? <button className="waSend" aria-label="Enviar mensagem" disabled={typing}><Send size={18}/></button>
              : <button type="button" className={'waSend' + (listening ? ' listening' : '')} aria-label="Gravar áudio" onClick={listen} disabled={typing || listening}><Mic size={19}/></button>}
          </form>}
      </div>

      <aside className="sheet" aria-label="Ficha montada pela assistente">
        <div className="sheetHead"><span className="metricIcon green"><Sparkles size={18}/></span><div><h2>Ficha do atendimento</h2><small>Montada pela assistente durante a conversa</small></div></div>
        <div className="progress" aria-label={`Triagem ${progress}% concluída`}><span style={{width: progress + '%'}}/></div>
        <small className="progressLabel">{info ? `${progress}% da triagem concluída` : 'Aguardando o relato do cliente'}</small>
        {info?.urgent && <div className="alert"><TriangleAlert size={18}/><div><strong>Prioridade</strong><p>{answers.deadline || 'O cliente relatou urgência.'}</p></div></div>}
        <dl className="sheetList">{fields.map(([label, value]) => <div key={label} className={value ? 'filled' : ''}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}
          <div className={docs.length ? 'filled' : ''}><dt>Documentos</dt><dd>{docs.length ? docs.length + ' recebido(s)' : '—'}</dd></div></dl>
        <p className="sheetNote">A assistente não promete resultados nem dá parecer jurídico. Pergunte "vou ganhar?" para ver como ela responde.</p>
      </aside>
    </section>
  </>;
}
