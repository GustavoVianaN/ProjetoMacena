import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Scale, Inbox, Users, FolderOpen, FlaskConical, Search, ChevronDown, ChevronRight, MessageCircle, Clock3, TriangleAlert, CheckCircle2, CircleHelp, Plus, X, Send, Menu, MessageSquareText, Bot, UserRound, FileText, Headset, LayoutDashboard, Route, Bell, LogOut, Copy, Eye, EyeOff, Moon, FileWarning, Mic, Sparkles, ShieldCheck, Check} from 'lucide-react';
import {areas, statuses, users, makeSeed, normalize, initials, firstName, maskCpf, formatCpf, when, afterHours, suggestedDocs, welcome} from './data';
import Login from './Login';
import Simulation from './Simulation';
import './style.css';

const STORE = 'macena.demo.v2';
const SESSION = 'macena.session';
const nav = [['Visão geral', LayoutDashboard], ['Atendimentos', Inbox], ['Clientes', Users], ['Documentos', FolderOpen], ['Simular atendimento', FlaskConical], ['Roadmap', Route]];
const slug = value => statuses.indexOf(value);
const load = () => { try { return JSON.parse(localStorage.getItem(STORE)) || makeSeed(); } catch { return makeSeed(); } };
const readSession = () => { try { return localStorage.getItem(SESSION) || sessionStorage.getItem(SESSION); } catch { return null; } };
const history = item => item.messages || [
  {role: 'assistant', text: welcome},
  {role: 'client', text: item.report},
  {role: 'assistant', text: 'Entendi. Vou fazer algumas perguntas rápidas para que a equipe já receba seu caso organizado.'},
];
const pendingDocs = item => !item.docs?.length && item.status !== 'Concluído';
const badge = item => <span className={'status s' + slug(item.status)}><i/>{item.status}</span>;
const areaClass = area => 'a' + areas.indexOf(area);

function Root() {
  const [login, setLogin] = useState(readSession);
  function enter(user, remember) {
    try { (remember ? localStorage : sessionStorage).setItem(SESSION, user); } catch { /* Sessão apenas em memória. */ }
    setLogin(user);
  }
  function leave() {
    try { localStorage.removeItem(SESSION); sessionStorage.removeItem(SESSION); } catch { /* Nada a limpar. */ }
    setLogin(null);
  }
  return users[login] ? <App account={users[login]} onLogout={leave}/> : <Login onLogin={enter}/>;
}

function App({account, onLogout}) {
  const [records, setRecords] = useState(load);
  const [page, setPage] = useState('Visão geral');
  const [selected, setSelected] = useState(1);
  const [tab, setTab] = useState('Resumo');
  const [filter, setFilter] = useState('Todos');
  const [area, setArea] = useState('');
  const [search, setSearch] = useState('');
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const [help, setHelp] = useState(false);
  const [bell, setBell] = useState(false);
  const [reply, setReply] = useState('');
  const [showCpf, setShowCpf] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => { try { localStorage.setItem(STORE, JSON.stringify(records)); } catch { /* A sessão continua em memória. */ } }, [records]);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const sorted = [...records].sort((a, b) => b.createdAt - a.createdAt);
  const visible = sorted.filter(item => (!area || item.area === area) &&
    (filter === 'Todos' || (filter === 'Urgentes' ? item.urgent && item.status !== 'Concluído' : filter === 'Documentos pendentes' ? pendingDocs(item) : item.status === filter)) &&
    normalize([item.name, item.area, item.subject, item.report, item.city].join(' ')).includes(normalize(search.trim())));
  const current = visible.find(item => item.id === selected) || visible[0];
  const unread = sorted.filter(item => item.unread);

  function notify(title, text) {
    setToast({title, text});
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4200);
  }
  function patch(id, changes) {
    setRecords(list => list.map(item => item.id === id ? {...item, ...changes} : item));
  }
  function open(item, nextTab = 'Resumo') {
    setSelected(item.id); setTab(nextTab); setReply(''); setShowCpf(false); setDrawer(true); setBell(false);
    if (item.unread) patch(item.id, {unread: false});
  }
  function navigate(next) {
    setPage(next); setMenu(false); setDrawer(false); setFilter('Todos'); setSearch(''); setArea(''); setBell(false);
    window.scrollTo?.(0, 0);
  }
  function goTo(item, nextTab) {
    navigate('Atendimentos'); open(item, nextTab);
  }
  function showList(target) {
    navigate('Atendimentos'); setFilter(target);
  }
  function saveSimulation(item) {
    const record = {...item, id: Date.now(), status: 'Para assumir', unread: true};
    setRecords(list => [record, ...list]);
    navigate('Atendimentos');
    setSelected(record.id); setTab('Resumo'); setDrawer(true);
    notify('Novo atendimento recebido', `${record.name} · ${record.area}${record.urgent ? ' · prioridade' : ''}`);
  }
  function takeOver(item) {
    patch(item.id, {status: 'Em atendimento', responsible: account.name, unread: false});
    setFilter('Todos'); setTab('Conversa');
    notify('Você assumiu o atendimento', 'A assistente virtual foi pausada nesta conversa.');
  }
  function requestDocs(item) {
    const text = `Olá, ${firstName(item.name)}! Para darmos andamento ao seu atendimento, pode enviar por aqui foto ou PDF de:\n• ${suggestedDocs(item.area).join('\n• ')}`;
    patch(item.id, {messages: [...history(item), {role: item.status === 'Em atendimento' ? 'lawyer' : 'assistant', text}], docsRequested: true});
    notify('Pedido de documentos enviado', `Mensagem enviada para ${firstName(item.name)} pelo WhatsApp (simulado).`);
  }
  async function copySummary(item) {
    const text = [`ATENDIMENTO · ${item.name}`, `Área: ${item.area} · ${item.subject}`, `Telefone: ${item.phone || '-'} · Cidade: ${item.city || '-'}`,
      item.urgent ? `PRAZO: ${item.deadline}` : null, '', `Relato: ${item.report}`, '', ...(item.answers || []).map(([key, value]) => `${key}: ${value}`),
      '', `Documentos: ${item.docs?.length ? item.docs.join(', ') : 'nenhum'}`].filter(line => line !== null).join('\n');
    try { await navigator.clipboard.writeText(text); notify('Resumo copiado', 'Cole no sistema do escritório ou envie para a equipe.'); }
    catch { notify('Não foi possível copiar', 'O navegador bloqueou o acesso à área de transferência.'); }
  }
  function resetDemo() {
    setRecords(makeSeed()); setHelp(false); navigate('Visão geral');
    notify('Demonstração restaurada', 'Os atendimentos de exemplo foram recarregados.');
  }

  const metrics = [
    ['Total de atendimentos', records.length, Inbox, 'green', 'Todos'],
    ['Aguardando equipe', records.filter(item => item.status === 'Para assumir').length, Clock3, 'sand', 'Para assumir'],
    ['Casos urgentes', records.filter(item => item.urgent && item.status !== 'Concluído').length, TriangleAlert, 'rose', 'Urgentes'],
    ['Documentos pendentes', records.filter(pendingDocs).length, FileWarning, 'mint', 'Documentos pendentes'],
  ];
  const metricRow = <section className="metrics" aria-label="Indicadores">{metrics.map(([label, count, Icon, color, target]) => <button className="metric" key={label} onClick={() => { showList(target); }}><span className={'metricIcon ' + color}><Icon size={19}/></span><span><small>{label}</small><strong>{count}</strong></span></button>)}</section>;

  return <div className="app">
    {menu && <div className="mobileShade" onClick={() => setMenu(false)}/>}
    <aside className={'sidebar' + (menu ? ' expanded' : '')}>
      <div className="brand"><div className="brandIcon"><Scale size={24}/></div><div><strong>MACENA</strong><small>ADVOGADOS</small></div><button className="iconButton closeMenu" aria-label="Fechar menu" onClick={() => setMenu(false)}><X size={20}/></button></div>
      <nav aria-label="Menu principal"><div className="navCaption">ESCRITÓRIO</div>{nav.map(([label, Icon]) => <button key={label} className={page === label ? 'navItem active' : 'navItem'} aria-current={page === label ? 'page' : undefined} onClick={() => navigate(label)}><Icon size={19}/>{label}{label === 'Atendimentos' && unread.length > 0 && <span className="navCount">{unread.length}</span>}</button>)}</nav>
      <div className="sidebarBottom"><button className="navItem" onClick={() => { setHelp(true); setMenu(false); }}><CircleHelp size={19}/> Ajuda</button>
        <div className="account"><div className="avatar staff">{initials(account.name)}</div><div><strong>{account.name}</strong><small>{account.role}</small></div><button className="iconButton logout" aria-label="Sair" title="Sair" onClick={onLogout}><LogOut size={18}/></button></div></div>
    </aside>
    <div className="body">
      <header className="top">
        <div><button className="iconButton mobileMenu" aria-label="Abrir menu" onClick={() => setMenu(true)}><Menu size={22}/></button><span className="crumb">Área de trabalho</span><span className="slash crumb">/</span><strong>{page}</strong></div>
        <div className="topActions">
          <span className="demo"><i/> Ambiente demo</span>
          <div className="bellWrap">
            <button className="iconButton bell" aria-label={`Notificações: ${unread.length} novas`} aria-expanded={bell} onClick={() => setBell(value => !value)}><Bell size={20}/>{unread.length > 0 && <span className="bellCount">{unread.length}</span>}</button>
            {bell && <div className="bellMenu" role="menu"><strong className="bellTitle">Novos atendimentos</strong>
              {unread.length ? unread.map(item => <button key={item.id} role="menuitem" className="bellItem" onClick={() => goTo(item)}><span className={'avatar ' + areaClass(item.area)}>{initials(item.name)}</span><span><strong>{item.name}</strong><small>{item.area} · {when(item.createdAt)}</small></span>{item.urgent && <TriangleAlert className="urgentIcon" size={15}/>}</button>)
                : <p className="empty">Nenhuma novidade por enquanto.</p>}</div>}
          </div>
        </div>
      </header>
      <main>
      {page === 'Visão geral' && <Overview account={account} records={sorted} metricRow={metricRow} onOpen={goTo} onList={showList} onSimulate={() => navigate('Simular atendimento')}/>}

      {page === 'Atendimentos' && <>
        <div className="heading"><div><h1>Central de atendimento</h1><p>Acompanhe e organize os contatos recebidos pelo WhatsApp.</p></div><button className="primary" onClick={() => navigate('Simular atendimento')}><Plus size={18}/> Simular atendimento</button></div>
        {metricRow}
        <section className={'inbox' + (drawer ? ' drawerOpen' : '')}>
          <div className="queue"><div className="queueHead"><h2>Conversas <span>{visible.length}</span></h2>
            <label className="search"><Search size={17}/><input placeholder="Buscar por nome, assunto ou cidade…" aria-label="Buscar conversas" value={search} onChange={event => setSearch(event.target.value)}/></label>
            <div className="filters"><label><select aria-label="Status" value={filter} onChange={event => setFilter(event.target.value)}>{['Todos', ...statuses, 'Urgentes', 'Documentos pendentes'].map(value => <option key={value}>{value}</option>)}</select><ChevronDown size={14}/></label>
              <label><select aria-label="Área jurídica" value={area} onChange={event => setArea(event.target.value)}><option value="">Todas as áreas</option>{[...areas, 'A classificar'].map(value => <option key={value}>{value}</option>)}</select><ChevronDown size={14}/></label></div></div>
          <div>{visible.map(item => <button className={'person' + (current?.id === item.id ? ' chosen' : '') + (item.unread ? ' unread' : '')} key={item.id} onClick={() => open(item)}><span className={'avatar ' + areaClass(item.area)}>{initials(item.name)}</span><span className="personText"><strong>{item.name}</strong><small>{item.area} · {item.subject}</small><span className="personMeta">{badge(item)}{item.urgent && item.status !== 'Concluído' && <TriangleAlert className="urgentIcon" size={14} aria-label="Urgente"/>}{afterHours(item.createdAt) && <Moon className="nightIcon" size={13} aria-label="Recebido fora do expediente"/>}</span></span><time>{when(item.createdAt)}{item.unread && <i className="dot" aria-label="Não lido"/>}</time></button>)}
          {!visible.length && <p className="empty">Nenhuma conversa encontrada.</p>}</div></div>

          <div className="detail">{current ? <>
            <div className="detailHead"><button className="iconButton closeDrawer" aria-label="Voltar às conversas" onClick={() => setDrawer(false)}><ChevronRight size={20} style={{transform: 'rotate(180deg)'}}/></button><div className={'avatar large ' + areaClass(current.area)}>{initials(current.name)}</div><div className="identity"><h2>{current.name}</h2><small><MessageCircle size={14}/> WhatsApp <b>·</b> {when(current.createdAt)}</small></div>
              <button className="secondary copy" onClick={() => copySummary(current)} title="Copiar resumo"><Copy size={16}/><span>Copiar resumo</span></button></div>
            <div className="tabs" role="group" aria-label="Detalhes do atendimento">{['Resumo', 'Conversa', 'Documentos'].map(label => <button key={label} className={tab === label ? 'selectedTab' : ''} aria-pressed={tab === label} onClick={() => setTab(label)}>{label}{label === 'Documentos' && current.docs?.length ? <span>{current.docs.length}</span> : null}</button>)}</div>
            <div className="detailBody">
              {current.status === 'Em atendimento' && <div className="control"><Headset size={18}/><p><strong>{current.responsible || account.name} está no controle.</strong> A assistente virtual está pausada nesta conversa.</p></div>}
              {tab === 'Resumo' && <>
                {current.urgent && current.status !== 'Concluído' && <div className="alert"><TriangleAlert size={19}/><div><strong>Prazo sinalizado</strong><p>{current.deadline || 'O cliente relatou urgência no atendimento.'}</p></div></div>}
                <div className="summaryTitle"><span className="metricIcon green"><MessageSquareText size={17}/></span><h3>Resumo da triagem</h3></div>
                <div className="information">
                  <div><small>Área jurídica</small><strong className="areaTag">{current.area}</strong></div>
                  <div><small>Assunto</small><strong>{current.subject}</strong></div>
                  <div><small>Telefone (WhatsApp)</small><strong>{current.phone || 'Não informado'}</strong></div>
                  <div><small>CPF</small><strong className="cpf">{showCpf && current.cpf ? formatCpf(current.cpf) : maskCpf(current.cpf)}{current.cpf && <button className="iconButton" aria-label={showCpf ? 'Ocultar CPF' : 'Mostrar CPF'} onClick={() => setShowCpf(value => !value)}>{showCpf ? <EyeOff size={15}/> : <Eye size={15}/>}</button>}</strong></div>
                  <div><small>Cidade</small><strong>{current.city || 'Não informada'}</strong></div>
                  <div><small>Status</small>{badge(current)}</div>
                  <div><small>Responsável</small><strong>{current.responsible || 'Aguardando'}</strong></div>
                  <div><small>Documentos</small>{pendingDocs(current) ? <strong className="pending">Pendentes</strong> : <strong>{current.docs?.length || 0} recebido(s)</strong>}</div>
                </div>
                <div className="report"><h3>Relato do cliente</h3><p>{current.report}</p></div>
                {current.answers?.length > 0 && <div className="report"><h3>Informações coletadas</h3><dl>{current.answers.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl></div>}
              </>}
              {tab === 'Conversa' && <Chat messages={history(current)}/>}
              {tab === 'Documentos' && <Documents item={current} onRequest={() => requestDocs(current)}/>}
            </div>
            <div className="detailFooter">{current.status === 'Em atendimento' ? <>
              <form className="compose compact" onSubmit={event => { event.preventDefault(); if (!reply.trim()) return; patch(current.id, {messages: [...history(current), {role: 'lawyer', text: reply.trim()}]}); setReply(''); setTab('Conversa'); }}>
                <input aria-label="Mensagem da equipe" placeholder="Responder ao cliente…" value={reply} onChange={event => setReply(event.target.value)}/><button className="primary" aria-label="Enviar resposta" disabled={!reply.trim()}><Send size={16}/></button></form>
              <button className="secondary" onClick={() => { patch(current.id, {status: 'Concluído'}); setFilter('Todos'); notify('Atendimento concluído', current.name); }}><Check size={16}/> Concluir</button></>
              : current.status === 'Concluído' ? <button className="secondary" onClick={() => { patch(current.id, {status: 'Em atendimento'}); setFilter('Todos'); }}>Reabrir atendimento</button>
              : <button className="primary" onClick={() => takeOver(current)}><Headset size={17}/> Assumir atendimento</button>}</div>
          </> : <p className="empty">Selecione uma conversa para visualizar o atendimento.</p>}</div>
        </section>
      </>}

      {page === 'Simular atendimento' && <Simulation onSave={saveSimulation}/>}
      {page === 'Clientes' && <Clients records={sorted} search={search} setSearch={setSearch} onOpen={goTo}/>}
      {page === 'Documentos' && <DocumentsPage records={sorted} search={search} setSearch={setSearch} onOpen={goTo} onRequest={requestDocs}/>}
      {page === 'Roadmap' && <Roadmap/>}
      </main>
    </div>

    {toast && <div className="toast" role="status"><span className="metricIcon green"><Check size={16}/></span><div><strong>{toast.title}</strong><small>{toast.text}</small></div><button className="iconButton" aria-label="Fechar aviso" onClick={() => setToast(null)}><X size={16}/></button></div>}
    {help && <div className="overlay" onClick={() => setHelp(false)}><section className="dialog" role="dialog" aria-modal="true" aria-label="Sobre a demonstração" onClick={event => event.stopPropagation()}>
      <button autoFocus className="iconButton" aria-label="Fechar ajuda" onClick={() => setHelp(false)}><X size={20}/></button>
      <h2>Sobre a demonstração</h2>
      <p>Este é um protótipo do MVP. A conversa do simulador representa o WhatsApp do escritório e a triagem usa regras locais no lugar da inteligência artificial. Use apenas dados fictícios. Os registros ficam salvos somente neste navegador.</p>
      <div className="dialogActions"><button className="primary" onClick={() => { setHelp(false); navigate('Simular atendimento'); }}>Abrir simulador</button><button className="secondary" onClick={resetDemo}>Restaurar dados de exemplo</button></div>
    </section></div>}
  </div>;
}

function Overview({account, records, metricRow, onOpen, onList, onSimulate}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const attention = records.filter(item => item.status === 'Para assumir' || (item.urgent && item.status !== 'Concluído'))
    .sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0)).slice(0, 5);
  const night = records.filter(item => afterHours(item.createdAt)).length;
  const counts = areas.map(name => [name, records.filter(item => item.area === name).length]);
  const max = Math.max(1, ...counts.map(([, count]) => count));
  return <>
    <div className="heading"><div><h1>{greeting}, {firstName(account.name)}</h1><p>{new Date().toLocaleDateString('pt-BR', {weekday: 'long', day: 'numeric', month: 'long'})} · Resumo do atendimento do escritório.</p></div><button className="primary" onClick={onSimulate}><Plus size={18}/> Simular atendimento</button></div>
    {metricRow}
    <section className="overview">
      <div className="card attention"><div className="cardHead"><h2>Precisam de atenção</h2><button className="link" onClick={() => onList('Para assumir')}>Ver todos</button></div>
        {attention.map(item => <button key={item.id} className="directoryRow" onClick={() => onOpen(item)}><span className={'avatar ' + areaClass(item.area)}>{initials(item.name)}</span><span><strong>{item.name}</strong><small>{item.urgent ? item.deadline : item.subject}</small></span>{item.urgent ? <span className="status hot"><TriangleAlert size={12}/> Prazo</span> : badge(item)}</button>)}
        {!attention.length && <p className="empty">Tudo em dia. Nenhum atendimento aguardando.</p>}</div>
      <div className="card nightCard"><span className="metricIcon sand"><Moon size={19}/></span><strong>{night}</strong><p>atendimentos recebidos <b>fora do expediente</b>, à noite ou no fim de semana, já triados pela assistente.</p></div>
      <div className="card"><div className="cardHead"><h2>Atendimentos por área</h2></div>
        <div className="bars">{counts.map(([name, count]) => <div key={name} className="bar"><span>{name}</span><span className="track"><span className={areaClass(name)} style={{width: count / max * 100 + '%'}}/></span><strong>{count}</strong></div>)}</div></div>
      <div className="card how"><div className="cardHead"><h2>Como funciona</h2></div>
        <ol className="flow">{[[MessageCircle, 'Cliente escreve ou manda áudio no WhatsApp'], [Bot, 'A assistente acolhe e entende o caso'], [Sparkles, 'Identifica a área e faz as perguntas certas'], [Headset, 'Advogado recebe a ficha e assume']].map(([Icon, text], index) => <li key={text}><span className="flowIcon"><Icon size={18}/></span><small>Etapa {index + 1}</small><p>{text}</p></li>)}</ol></div>
    </section>
  </>;
}

function Chat({messages}) {
  return <div className="chat" role="log" aria-label="Histórico de mensagens">{messages.map(({role, text, file, audio}, index) => <div key={index} className={'bubble ' + role}>
    <small>{role === 'client' ? <UserRound size={13}/> : role === 'lawyer' ? <Scale size={13}/> : <Bot size={14}/>} {role === 'client' ? 'Cliente' : role === 'lawyer' ? 'Equipe jurídica' : 'Assistente virtual'}{audio && <> · <Mic size={12}/> áudio transcrito</>}</small>
    {file ? <p className="fileLine"><FileText size={16}/>{text}</p> : <p>{text}</p>}</div>)}</div>;
}

function Documents({item, onRequest}) {
  return <>
    {item.docs?.length ? <><p className="muted">Arquivos enviados pelo cliente.</p>{item.docs.map((doc, index) => <div className="document" key={index}><FileText size={20}/>{doc}</div>)}</> : <p className="muted">O cliente ainda não enviou documentos.</p>}
    {item.status !== 'Concluído' && <div className="suggest"><h3>Documentos sugeridos para {item.area}</h3><ul>{suggestedDocs(item.area).map(doc => <li key={doc}>{doc}</li>)}</ul>
      <button className="secondary" onClick={onRequest} disabled={item.docsRequested}><Send size={15}/> {item.docsRequested ? 'Pedido já enviado' : 'Solicitar pelo WhatsApp'}</button></div>}
  </>;
}

function Clients({records, search, setSearch, onOpen}) {
  const groups = Object.values(records.reduce((all, item) => {
    const key = item.cpf || item.phone || item.name;
    (all[key] ||= {...item, cases: []}).cases.push(item);
    return all;
  }, {})).filter(client => normalize([client.name, client.city, client.phone, client.area].join(' ')).includes(normalize(search.trim())));
  return <>
    <div className="heading"><div><h1>Clientes</h1><p>Cadastro criado automaticamente a partir dos atendimentos. O CPF evita cadastros duplicados.</p></div></div>
    <div className="directory"><label className="search"><Search size={17}/><input aria-label="Buscar clientes" placeholder="Buscar por nome, cidade ou telefone…" value={search} onChange={event => setSearch(event.target.value)}/></label>
      {groups.map(client => <button className="directoryRow" key={client.id} onClick={() => onOpen(client.cases[0])}><span className={'avatar ' + areaClass(client.area)}>{initials(client.name)}</span>
        <span><strong>{client.name}</strong><small>{client.city || 'Cidade não informada'} · {client.phone} · CPF {maskCpf(client.cpf)}</small></span>
        <span className="cases">{client.cases.length} atendimento{client.cases.length > 1 ? 's' : ''}</span>{badge(client.cases[0])}</button>)}
      {!groups.length && <p className="empty">Nenhum cliente encontrado.</p>}</div>
  </>;
}

function DocumentsPage({records, search, setSearch, onOpen, onRequest}) {
  const term = normalize(search.trim());
  const received = records.flatMap(item => (item.docs || []).map(doc => ({doc, item}))).filter(({doc, item}) => normalize(doc + ' ' + item.name).includes(term));
  const pending = records.filter(pendingDocs).filter(item => normalize(item.name).includes(term));
  return <>
    <div className="heading"><div><h1>Documentos</h1><p>Arquivos recebidos pelo WhatsApp e clientes que ainda precisam enviar documentos.</p></div></div>
    <div className="directory"><label className="search"><Search size={17}/><input aria-label="Buscar documentos" placeholder="Buscar por arquivo ou cliente…" value={search} onChange={event => setSearch(event.target.value)}/></label>
      <h2 className="groupTitle"><FileWarning size={17}/> Pendentes <span>{pending.length}</span></h2>
      {pending.map(item => <div className="directoryRow" key={item.id}><span className={'avatar ' + areaClass(item.area)}>{initials(item.name)}</span><button className="rowLink" onClick={() => onOpen(item, 'Documentos')}><strong>{item.name}</strong><small>{item.area} · {suggestedDocs(item.area)[0]}…</small></button>
        <button className="secondary small" onClick={() => onRequest(item)} disabled={item.docsRequested}>{item.docsRequested ? 'Solicitado' : 'Solicitar'}</button></div>)}
      {!pending.length && <p className="empty">Nenhum documento pendente.</p>}
      <h2 className="groupTitle"><FileText size={17}/> Recebidos <span>{received.length}</span></h2>
      {received.map(({doc, item}, index) => <button className="directoryRow" key={item.id + '-' + index} onClick={() => onOpen(item, 'Documentos')}><span className="metricIcon green"><FileText size={20}/></span><span><strong>{doc}</strong><small>{item.name} · {when(item.createdAt)}</small></span></button>)}
      {!received.length && <p className="empty">Nenhum documento encontrado.</p>}</div>
  </>;
}

const phases = [
  ['Fase 1', 'Atendimento pelo WhatsApp', 'Prioridade', [['Conversa pelo número oficial (API do WhatsApp Business)', false], ['IA conversando de forma natural, 24 horas', false], ['Transcrição automática de áudios', false], ['Mensagem de boas-vindas e aviso de LGPD', true]]],
  ['Fase 2', 'Inteligência jurídica', 'Demonstrado', [['Identificação das 4 áreas de atuação', true], ['Perguntas específicas por área', true], ['Detecção de prazos e urgências', true], ['Não repete o que o cliente já contou', true], ['Não promete resultados nem dá parecer', true]]],
  ['Fase 3', 'Cadastro e organização', 'Demonstrado', [['Painel com atendimentos, filtros e busca', true], ['Cadastro automático de clientes', true], ['Controle de documentos pendentes', true], ['Advogado assume a conversa a qualquer momento', true], ['Login da equipe e notificações', true]]],
  ['Fase 4', 'Integração com o escritório', 'Futuro', [['Sistema de gestão processual', false], ['Agenda e tarefas', false], ['Consulta de andamento por clientes atuais', false]]],
];

function Roadmap() {
  return <>
    <div className="heading"><div><h1>Roadmap do projeto</h1><p>Secretária virtual com inteligência artificial · Macena Advogados</p></div></div>
    <section className="phases">{phases.map(([number, title, tag, items]) => <article className="card phase" key={number}>
      <div className="phaseHead"><small>{number}</small><span className={'phaseTag ' + normalize(tag)}>{tag}</span></div><h2>{title}</h2>
      <ul>{items.map(([text, demo]) => <li key={text} className={demo ? 'yes' : ''}>{demo ? <CheckCircle2 size={16}/> : <Clock3 size={16}/>}<span>{text}<small>{demo ? 'Nesta demonstração' : 'Implementação de produção'}</small></span></li>)}</ul></article>)}</section>
    <section className="principles">{[[Sparkles, 'Personalidade própria', 'Educada, acolhedora e confiável, sem frases repetidas.'], [ShieldCheck, 'Segurança e sigilo', 'LGPD, controle de acesso, dados criptografados e confidencialidade.'], [Headset, 'Advogado no controle', 'A IA organiza; decisões e orientações jurídicas ficam com o profissional.']].map(([Icon, title, text]) => <div className="card principle" key={title}><span className="metricIcon green"><Icon size={19}/></span><h3>{title}</h3><p>{text}</p></div>)}</section>
    <div className="card decision"><CircleHelp size={22}/><div><h3>Decisão para a próxima etapa</h3><p>A assistente vai atender só <b>novos clientes</b> ou também <b>clientes com processos em andamento</b>, para consultar andamento e documentos pendentes? A segunda opção exige integração com o sistema processual e confirmação de identidade.</p></div></div>
  </>;
}

// Tradutores automáticos e extensões podem alterar o DOM e derrubar o React.
// Em vez de deixar a tela branca, mostra uma tela para recarregar.
class Recover extends React.Component {
  state = {failed: false};
  static getDerivedStateFromError() { return {failed: true}; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <div className="recover"><div className="loginMark"><Scale size={22}/></div><h2>Vamos recarregar a página</h2><p>Algo interferiu na exibição, possivelmente o tradutor automático do navegador ou uma extensão. Seus dados estão salvos.</p><button className="primary" onClick={() => location.reload()}>Recarregar</button></div>;
  }
}

createRoot(document.getElementById('root')).render(<Recover><Root/></Recover>);
