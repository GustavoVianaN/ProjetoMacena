import React, {useEffect, useRef, useState} from 'react';
import {Scale, Send, Paperclip, Mic, FileText, CheckCheck, ShieldCheck, X, RotateCcw, Sparkles, TriangleAlert, BadgeCheck, Users} from 'lucide-react';
import {useConversation} from './engine';
import {lawyers, initials, clock, maskCpf, fakeCpf, fakePhone, questions, examples} from './data';

const Recognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

export function LawyerAvatar({lawyer, size = ''}) {
  const data = lawyers[lawyer];
  return <span className={'avatar ' + data.tone + ' ' + size}>{lawyer === 'parceiros' ? <Users size={16}/> : initials(data.name)}</span>;
}

function Handoff({lawyer}) {
  const data = lawyers[lawyer];
  return <div className="handoff"><LawyerAvatar lawyer={lawyer} size="large"/><div><small>{lawyer === 'parceiros' ? 'Encaminhado para' : 'Seu especialista'}</small><strong>{data.name}{lawyer !== 'parceiros' && <BadgeCheck size={15}/>}</strong><span>{data.title}</span></div></div>;
}

function Messages({conversation, style}) {
  const log = useRef(null);
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight; }, [conversation.messages, conversation.typing]);
  return <div className={style + 'Log'} ref={log} role="log" aria-label="Conversa">
    {style === 'wa' && <><span className="waDay">Hoje</span><span className="waLock"><ShieldCheck size={13}/> Conversa protegida. Dados usados somente pelo escritório.</span></>}
    {conversation.messages.map((message, index) => message.role === 'handoff' ? <Handoff key={index} lawyer={message.lawyer}/> : <div key={index} className={style + ' ' + message.role}>
      {message.audio && <small className="waAudio"><Mic size={12}/> Áudio transcrito</small>}
      {message.file ? <span className="waFile"><FileText size={18}/>{message.text}</span> : <p>{message.text}</p>}
      <time>{clock(message.at)}{message.role === 'client' && style === 'wa' && <CheckCheck size={14}/>}</time>
    </div>)}
    {conversation.typing && <div className={style + ' assistant typing'} aria-label="Digitando"><i/><i/><i/></div>}
  </div>;
}

function Composer({conversation, style, onDone}) {
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState('');
  const {step, info, typing, done, messages} = conversation;
  function submit(event) {
    event.preventDefault();
    if (!input.trim() || typing) return;
    conversation.send(input);
    setInput('');
  }
  function listen() {
    if (!Recognition) return setNotice('Este navegador não permite ditado por voz. Na versão final, os áudios do cliente serão transcritos automaticamente.');
    const recognition = new Recognition();
    recognition.lang = 'pt-BR';
    recognition.onresult = event => conversation.send(event.results[0][0].transcript, {audio: true});
    recognition.onerror = () => setNotice('Não consegui ouvir o áudio. Verifique a permissão do microfone.');
    recognition.onend = () => setListening(false);
    setNotice(''); setListening(true); recognition.start();
  }
  return <>
    {!info && !typing && messages.length === 1 && <div className="chips">{examples.map(text => <button key={text} onClick={() => conversation.send(text)}>{text}</button>)}</div>}
    {step?.key === 'cpf' && !typing && <div className="chips"><button onClick={() => setInput(fakeCpf())}>Gerar CPF fictício</button></div>}
    {step?.key === 'phone' && !typing && <div className="chips"><button onClick={() => setInput(fakePhone())}>Usar telefone fictício</button></div>}
    {notice && <p className="waNotice" role="status">{notice}</p>}
    {done && !typing ? <div className="chatDone"><span><BadgeCheck size={17}/> Caso enviado ao painel do escritório</span>{onDone && <button className="primary" onClick={onDone}>Ver no painel</button>}</div>
      : <form className={style + 'Compose'} onSubmit={submit}>
        <label className="waAttach" title="Enviar arquivo"><Paperclip size={20}/><input type="file" multiple aria-label="Enviar arquivos fictícios" onChange={event => { conversation.attach(event.target.files); event.target.value = ''; }}/></label>
        <input value={input} onChange={event => setInput(event.target.value)} placeholder={style === 'wa' ? 'Mensagem' : 'Escreva sua mensagem…'} aria-label="Sua mensagem" inputMode={step?.key === 'cpf' || step?.key === 'phone' ? 'tel' : 'text'}/>
        {input.trim() ? <button className="sendButton" aria-label="Enviar mensagem" disabled={typing}><Send size={18}/></button>
          : <button type="button" className={'sendButton' + (listening ? ' listening' : '')} aria-label="Gravar áudio" onClick={listen} disabled={typing || listening}><Mic size={19}/></button>}
      </form>}
  </>;
}

export function Sheet({conversation, channel}) {
  const {info, answers, docs, phone, progress, lawyer} = conversation;
  const fields = [
    ['Área jurídica', info?.area], ['Assunto', info?.subject], ['Encaminhado para', lawyer?.name], ['Nome completo', answers.name],
    ['WhatsApp', answers.phone || phone || null], ...(channel === 'whatsapp' ? [['CPF', answers.cpf && maskCpf(answers.cpf)]] : []),
    ['Cidade', answers.city], ['Já existe processo?', answers.process],
    ...(questions[info?.area] || []).map(([label]) => [label, answers[label]]),
  ];
  return <aside className="sheet" aria-label="Ficha montada pela assistente">
    <div className="sheetHead"><span className="metricIcon green"><Sparkles size={18}/></span><div><h2>Bastidores: ficha do caso</h2><small>O que o escritório recebe, montado durante a conversa</small></div></div>
    <div className="progress" aria-label={`Triagem ${progress}% concluída`}><span style={{width: progress + '%'}}/></div>
    <small className="progressLabel">{info ? `${progress}% da triagem concluída` : 'Aguardando o relato do cliente'}</small>
    {info?.urgent && <div className="alert"><TriangleAlert size={18}/><div><strong>Prioridade</strong><p>{answers.deadline || 'O cliente relatou urgência.'}</p></div></div>}
    <dl className="sheetList">{fields.map(([label, value]) => <div key={label} className={value ? 'filled' : ''}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}
      <div className={docs.length ? 'filled' : ''}><dt>Documentos</dt><dd>{docs.length ? docs.length + ' recebido(s)' : '—'}</dd></div></dl>
    <p className="sheetNote">A assistente se apresenta como assistente, não promete resultados e não dá parecer jurídico. Pergunte "vou ganhar?" ou "você é advogado?" para ver a resposta.</p>
  </aside>;
}

export function WhatsAppChat({onSave, onPanel}) {
  const [session, setSession] = useState(0);
  return <WhatsAppSession key={session} onSave={onSave} onPanel={onPanel} onRestart={() => setSession(value => value + 1)}/>;
}
function WhatsAppSession({onSave, onPanel, onRestart}) {
  const conversation = useConversation('whatsapp', onSave);
  return <section className="simulation">
    <div className="phone">
      <header className="waHead"><span className="waAvatar"><Scale size={18}/></span><div><strong>Macena Advogados</strong><small>{conversation.typing ? 'digitando…' : 'online · assistente do Dr. Paulo'}</small></div><button className="iconButton restart" aria-label="Nova conversa" title="Nova conversa" onClick={onRestart}><RotateCcw size={17}/></button></header>
      <Messages conversation={conversation} style="wa"/>
      <Composer conversation={conversation} style="wa" onDone={onPanel}/>
    </div>
    <Sheet conversation={conversation} channel="whatsapp"/>
  </section>;
}

// Widget de bate-papo usado na plataforma nacional e no site do escritório.
export function WebChat({channel, brand, open, onClose, onRestart, onSave, onPanel, starter}) {
  const conversation = useConversation(channel, onSave);
  const started = useRef(false);
  useEffect(() => {
    if (starter && !started.current) { started.current = true; conversation.send(starter); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const routed = conversation.info && conversation.info.area !== 'A classificar' ? conversation.info.lawyer : null;
  return <div className={'webChat ' + channel + (open ? ' open' : '')} role="dialog" aria-label={'Bate-papo ' + brand.name} aria-hidden={!open}>
    <header className="webHead">
      {routed ? <LawyerAvatar lawyer={routed}/> : <span className="webLogo">{brand.icon}</span>}
      <div><strong>{routed && routed !== 'parceiros' ? lawyers[routed].name : brand.name}</strong><small>{conversation.typing ? 'digitando…' : routed && routed !== 'parceiros' ? 'Assistente virtual · ' + lawyers[routed].title : brand.subtitle}</small></div>
      <button className="iconButton" aria-label="Recomeçar conversa" title="Recomeçar" onClick={onRestart}><RotateCcw size={17}/></button>
      <button className="iconButton" aria-label="Fechar bate-papo" onClick={onClose}><X size={19}/></button>
    </header>
    <Messages conversation={conversation} style="web"/>
    <Composer conversation={conversation} style="web" onDone={onPanel}/>
  </div>;
}
