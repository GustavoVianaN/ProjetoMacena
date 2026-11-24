import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Scale, Inbox, Users, FolderOpen, FlaskConical, Search, ChevronDown, MessageCircle, Clock3, TriangleAlert, CheckCircle2, CircleHelp, Plus, X, Send, Paperclip, Menu, MessageSquareText, Bot, UserRound, FileText, Headset} from 'lucide-react';
import {seed, areas, classify, questions, welcome} from './data';
import './style.css';

const nav = [['Atendimentos', Inbox], ['Clientes', Users], ['Documentos', FolderOpen], ['Simular triagem', FlaskConical]];
const statuses = ['Em triagem', 'Para assumir', 'Em atendimento', 'Concluído'];
const slug = value => statuses.indexOf(value);
const initials = name => name.split(' ').filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase();
const normalize = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const saved = () => { try { return JSON.parse(localStorage.getItem('macena.demo.v1')) || seed; } catch { return seed; } };
const history = item => item.messages || [
  {role: 'assistant', text: welcome},
  {role: 'client', text: item.report},
  {role: 'assistant', text: 'Entendi. Vou organizar seu relato para que nossa equipe possa avaliar a situação.'},
];
const badge = item => <span className={'status s' + slug(item.status)}><i />{item.status}</span>;

function App() {
  const [records, setRecords] = useState(saved);
  const [page, setPage] = useState('Atendimentos');
  const [selected, setSelected] = useState(1);
  const [tab, setTab] = useState('Resumo');
  const [filter, setFilter] = useState('Todos');
  const [area, setArea] = useState('');
  const [search, setSearch] = useState('');
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const [help, setHelp] = useState(false);
  const [reply, setReply] = useState('');
  useEffect(() => {try { localStorage.setItem('macena.demo.v1', JSON.stringify(records)); } catch { /* A sessão continua em memória. */ }}, [records]);
  const visible = records.filter(item => (!area || item.area === area) &&
    (filter === 'Todos' || (filter === 'Urgentes' ? item.urgent && item.status !== 'Concluído' : item.status === filter)) &&
    normalize([item.name, item.area, item.subject, item.report].join(' ')).includes(normalize(search.trim())));
  const current = visible.find(item => item.id === selected) || visible[0];
  const metrics = [
    ['Total de atendimentos', records.length, Inbox, 'green', 'Todos'],
    ['Aguardando equipe', records.filter(item => item.status === 'Para assumir').length, Clock3, 'sand', 'Para assumir'],
    ['Casos urgentes', records.filter(item => item.urgent && item.status !== 'Concluído').length, TriangleAlert, 'rose', 'Urgentes'],
    ['Concluídos', records.filter(item => item.status === 'Concluído').length, CheckCircle2, 'mint', 'Concluído'],
  ];
  function open(item) {
    setSelected(item.id); setTab('Resumo'); setReply(''); setDrawer(true);
  }
  function navigate(next) {
    setPage(next); setMenu(false); setDrawer(false); setFilter('Todos'); setSearch(''); setArea('');
  }
  function update(changes) {
    setRecords(list => list.map(item => item.id === current.id ? {...item, ...changes} : item));
  }
  function saveSimulation(item) {
    const id = Date.now();
    setRecords(list => [{...item, id, time: 'Agora', status: 'Para assumir'}, ...list]);
    navigate('Atendimentos'); open({id});
  }
  function openFromDirectory(item) {
    navigate('Atendimentos'); open(item);
  }
  return <div className="app">
    {menu && <div className="mobileShade" onClick={() => setMenu(false)} />}
    <aside className={'sidebar' + (menu ? ' expanded' : '')}>
      <div className="brand"><div className="brandIcon"><Scale size={24}/></div><div><strong>MACENA</strong><small>ADVOGADOS</small></div></div>
      <nav aria-label="Menu principal"><div className="navCaption">ESCRITÓRIO</div>{nav.map(([label, Icon]) => <button key={label} className={page === label ? 'navItem active' : 'navItem'} aria-current={page === label ? 'page' : undefined} onClick={() => navigate(label)}><Icon size={19}/>{label}</button>)}</nav>
      <div className="sidebarBottom"><button className="navItem" onClick={() => setHelp(true)}><CircleHelp size={19}/> Ajuda</button><div className="account"><div className="avatar staff">PM</div><div><strong>Paulo Macena</strong><small>Equipe jurídica</small></div></div></div>
    </aside>
    <div className="body">
      <header className="top"><div><button className="iconButton mobileMenu" aria-label="Abrir menu" onClick={() => setMenu(true)}><Menu size={22}/></button><span>Área de trabalho</span><span className="slash">/</span><strong>{page}</strong></div><span className="demo"><i/> Ambiente demo</span></header>
      <main>
      {page === 'Atendimentos' && <>
        <div className="heading"><div><h1>Central de atendimento</h1><p>Acompanhe e organize os contatos recebidos pelo WhatsApp.</p></div><button className="primary" onClick={() => navigate('Simular triagem')}><Plus size={18}/> Simular atendimento</button></div>
        <section className="metrics" aria-label="Indicadores">{metrics.map(([label, count, Icon, color, target]) => <button className="metric" key={label} onClick={() => {setFilter(target);setDrawer(false);setTab('Resumo');}}><span className={'metricIcon ' + color}><Icon size={19}/></span><span><small>{label}</small><strong>{count}</strong></span></button>)}</section>
        <section className={'inbox' + (drawer ? ' drawerOpen' : '')}>
          <div className="queue"><div className="queueHead"><h2>Conversas <span>{visible.length}</span></h2><label className="search"><Search size={17}/><input placeholder="Buscar conversas…" aria-label="Buscar conversas" value={search} onChange={event => setSearch(event.target.value)}/></label><div className="filters"><label><select aria-label="Status" value={filter} onChange={event => setFilter(event.target.value)}>{['Todos', ...statuses, 'Urgentes'].map(value => <option key={value}>{value}</option>)}</select><ChevronDown size={14}/></label><label><select aria-label="Área jurídica" value={area} onChange={event => setArea(event.target.value)}><option value="">Todas as áreas</option>{[...areas, 'A classificar'].map(value => <option key={value}>{value}</option>)}</select><ChevronDown size={14}/></label></div></div>
          <div>{visible.map(item => <button className={'person' + (current?.id === item.id ? ' chosen' : '')} key={item.id} onClick={() => open(item)}><span className={'avatar a' + areas.indexOf(item.area)}>{initials(item.name)}</span><span className="personText"><strong>{item.name}</strong><small>{item.subject}</small><span className="personMeta">{badge(item)}{item.urgent && item.status !== 'Concluído' && <TriangleAlert className="urgentIcon" size={14} aria-label="Urgente"/>}</span></span><time>{item.time}</time></button>)}
          {!visible.length && <p className="empty">Nenhuma conversa encontrada.</p>}</div></div>
          <div className="detail">{current ? <>
            <div className="detailHead"><div className={'avatar large a' + areas.indexOf(current.area)}>{initials(current.name)}</div><div className="identity"><h2>{current.name}</h2><small><MessageCircle size={14}/> WhatsApp <b>·</b> {current.time}</small></div><button className="iconButton closeDrawer" aria-label="Voltar às conversas" onClick={() => setDrawer(false)}><X size={20}/></button></div>
            <div className="tabs" role="group" aria-label="Detalhes do atendimento">{['Resumo', 'Conversa', 'Documentos'].map(label => <button key={label} className={tab === label ? 'selectedTab' : ''} aria-pressed={tab === label} onClick={() => setTab(label)}>{label}{label === 'Documentos' && current.docs?.length ? <span>{current.docs.length}</span> : null}</button>)}</div>
            <div className="detailBody">{tab === 'Resumo' && <>
              {current.urgent && <div className="alert"><TriangleAlert size={19}/><div><strong>Prazo sinalizado</strong><p>{current.answers?.find(([key]) => key === 'Prazo informado')?.[1] || 'O cliente relatou urgência no atendimento.'}</p></div></div>}
              <div className="summaryTitle"><span className="metricIcon green"><MessageSquareText size={17}/></span><h3>Resumo da triagem</h3></div>
              <div className="information"><div><small>Área jurídica</small><strong className="areaTag">{current.area}</strong></div><div><small>Assunto</small><strong>{current.subject}</strong></div><div><small>Cidade</small><strong>{current.city || 'Não informada'}</strong></div><div><small>Status</small>{badge(current)}</div></div>
              <div className="report"><h3>Relato do cliente</h3><p>{current.report}</p></div>
              {current.answers?.length > 0 && <div className="report"><h3>Informações coletadas</h3><dl>{current.answers.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl></div>}
            </>}
            {tab === 'Conversa' && <Chat messages={history(current)}/>}
            {tab === 'Documentos' && <Documents item={current}/>}
            </div>
            <div className="detailFooter">{current.status === 'Em atendimento' ? <><form className="compose compact" onSubmit={event => {event.preventDefault(); if (!reply.trim()) return; update({messages: [...history(current), {role: 'lawyer', text: reply.trim()}]});setReply('');setTab('Conversa');}}><input aria-label="Mensagem da equipe" placeholder="Responder na simulação…" value={reply} onChange={event => setReply(event.target.value)}/><button className="primary" aria-label="Adicionar resposta" disabled={!reply.trim()}><Send size={16}/></button></form><button className="secondary" onClick={() => {update({status:'Concluído'});setFilter('Todos');}}>Concluir</button></> : current.status === 'Concluído' ? <button className="secondary" onClick={() => {update({status:'Em atendimento'});setFilter('Todos');}}>Reabrir atendimento</button> : <button className="primary" onClick={() => {update({status:'Em atendimento'});setFilter('Todos');setTab('Conversa');}}><Headset size={17}/> Assumir atendimento</button>}</div>
          </> : <p className="empty">Selecione uma conversa para visualizar o atendimento.</p>}</div>
        </section>
      </>}
      {page === 'Simular triagem' && <Simulation onSave={saveSimulation}/>}
      {(page === 'Clientes' || page === 'Documentos') && <><div className="heading"><div><h1>{page}</h1><p>{page === 'Clientes' ? 'Consulte os contatos e acesse o histórico de atendimento.' : 'Consulte os arquivos registrados durante a triagem.'}</p></div></div><div className="directory"><label className="search"><Search size={17}/><input aria-label={'Buscar em ' + page} placeholder={'Buscar em ' + page.toLowerCase() + '…'} value={search} onChange={event => setSearch(event.target.value)}/></label>
        {page === 'Clientes' ? visible.map(item => <button className="directoryRow" key={item.id} onClick={() => openFromDirectory(item)}><span className={'avatar a' + areas.indexOf(item.area)}>{initials(item.name)}</span><span><strong>{item.name}</strong><small>{item.city || 'Cidade não informada'} · {item.area}</small></span>{badge(item)}</button>) : records.flatMap(item => (item.docs || []).filter(doc => normalize(doc + ' ' + item.name).includes(normalize(search))).map((doc, index) => <button className="directoryRow" key={item.id + '-' + index} onClick={() => {openFromDirectory(item);setTab('Documentos');}}><span className="metricIcon green"><FileText size={20}/></span><span><strong>{doc}</strong><small>{item.name}</small></span></button>))}
        {(page === 'Clientes' ? !visible.length : !records.some(item => item.docs?.some(doc => normalize(doc + ' ' + item.name).includes(normalize(search))))) && <p className="empty">Nenhum resultado encontrado.</p>}
      </div></>}
      </main>
    </div>
    {help && <div className="overlay" onClick={() => setHelp(false)}><section className="dialog" role="dialog" aria-modal="true" aria-label="Sobre a demonstração" onClick={event => event.stopPropagation()}><button autoFocus className="iconButton" aria-label="Fechar ajuda" onClick={() => setHelp(false)}><X size={20}/></button><h2>Sobre a demonstração</h2><p>Use dados fictícios para simular a triagem, consultar o resumo e assumir a conversa como membro da equipe. O histórico desta demonstração fica no navegador.</p><button className="primary" onClick={() => {setHelp(false);navigate('Simular triagem');}}>Abrir simulador</button></section></div>}
  </div>;
}

function Chat({messages}) {
  return <div className="chat" role="log" aria-label="Histórico de mensagens">{messages.map(({role, text}, index) => <div key={index} className={'bubble ' + role}><small>{role === 'client' ? <UserRound size={13}/> : role === 'lawyer' ? <Scale size={13}/> : <Bot size={14}/>} {role === 'client' ? 'Cliente' : role === 'lawyer' ? 'Equipe jurídica' : 'Assistente virtual'}</small><p>{text}</p></div>)}</div>;
}
function Documents({item}) {
  return item.docs?.length ? <><p className="muted">Arquivos registrados na demonstração.</p>{item.docs.map((doc, index) => <div className="document" key={index}><FileText size={20}/>{doc}</div>)}</> : <p className="empty">Nenhum documento registrado neste atendimento.</p>;
}
function Simulation({onSave}) {
  const [messages, setMessages] = useState([{role:'assistant',text:welcome}]);
  const [input, setInput] = useState('');
  const [report, setReport] = useState('');
  const [area, setArea] = useState('');
  const [answers, setAnswers] = useState([]);
  const [docs, setDocs] = useState([]);
  const prompts = [
    ['Nome fictício', 'Como posso chamar você?'],
    ['Cidade', 'Em qual cidade você mora?'],
    ['Existe processo judicial?', 'Já existe algum processo judicial relacionado a essa situação?'],
    ['Prazo informado', 'Existe alguma audiência, prazo ou outra urgência? Se não houver, pode responder “não”.'],
    ...(questions[area] || []).map(question => [question, question]),
  ];
  const done = !!report && answers.length === prompts.length;
  const log = React.useRef(null);
  useEffect(() => {if (log.current) log.current.scrollTop = log.current.scrollHeight;}, [messages]);
  function send(event) {
    event.preventDefault();
    const value = input.trim();
    if (!value || done) return;
    let response;
    if (!report) {
      const detected = classify(value);
      setArea(detected); setReport(value);
      response = (detected === 'A classificar' ? 'A equipe vai avaliar qual área atende melhor sua situação. ' : 'Pelo seu relato, vou encaminhar o contato para ' + detected + '. ') + prompts[0][1];
    } else {
      setAnswers([...answers, [prompts[answers.length][0], value]]);
      response = prompts[answers.length + 1]?.[1] || 'Obrigada pelas informações. O resumo está pronto para encaminhar à equipe jurídica. Você pode anexar documentos de exemplo antes de concluir.';
    }
    setMessages(previous => [...previous, {role:'client',text:value}, {role:'assistant',text:response}]);
    setInput('');
  }
  function finish() {
    const [name, city, , deadline] = answers.map(([, value]) => value);
    const urgent = !/^(n[aã]o\b|nenhum|sem (prazo|urg[eê]ncia))/i.test(deadline);
    onSave({name, city, area, report, subject: 'Triagem simulada', messages, docs, urgent, answers: answers.slice(2)});
  }
  return <><div className="heading"><div><h1>Simular triagem</h1><p>Experimente a conversa inicial pelo ponto de vista do cliente.</p></div></div>
    <section className="simulator"><div className="simHead"><span className="metricIcon green"><Bot size={22}/></span><div><h2>Assistente Macena</h2><small>Use apenas dados e arquivos fictícios.</small></div></div><div className="simLog" ref={log}><Chat messages={messages}/></div>{docs.length > 0 && <div className="attachments">{docs.map((doc, index) => <button className="secondary" key={index} onClick={() => setDocs(list => list.filter((_, position) => position !== index))} aria-label={'Remover ' + doc}><FileText size={14}/>{doc}<X size={14}/></button>)}</div>}
    <form className="compose" onSubmit={send}><label className="attach" title="Registrar arquivo de exemplo"><Paperclip size={20}/><input type="file" multiple aria-label="Registrar arquivos fictícios" onChange={event => {setDocs(list => [...new Set([...list, ...Array.from(event.target.files, file => file.name)])]);event.target.value = '';}}/></label>{done ? <button className="primary finish" type="button" onClick={finish}>Encaminhar para a equipe</button> : <><input value={input} onChange={event => setInput(event.target.value)} placeholder="Escreva sua mensagem…" aria-label="Sua mensagem"/><button className="primary" aria-label="Enviar mensagem" disabled={!input.trim()}><Send size={18}/></button></>}</form></section></>;
}
createRoot(document.getElementById('root')).render(<App/>);
