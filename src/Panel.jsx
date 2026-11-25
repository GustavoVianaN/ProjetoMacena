import React, {useEffect, useRef, useState} from 'react';
import {Scale, Inbox, Users, FolderOpen, Search, ChevronDown, ChevronRight, MessageCircle, Clock3, TriangleAlert, CheckCircle2, CircleHelp, X, Send, Menu, MessageSquareText, Bot, UserRound, FileText, Headset, LayoutDashboard, Route, Bell, Copy, Eye, EyeOff, Moon, FileWarning, Mic, Sparkles, ShieldCheck, Check, ArrowLeftRight, Globe, Phone, BadgeCheck} from 'lucide-react';
import {PLATFORM, areas, statuses, account, lawyers, channels, makeSeed, normalize, initials, firstName, maskCpf, formatCpf, when, afterHours, suggestedDocs} from './data';
import {LawyerAvatar} from './Chat';
import {BridgeMark} from './Sites';

const nav = [['Visão geral', LayoutDashboard], ['Atendimentos', Inbox], ['Clientes', Users], ['Documentos', FolderOpen], ['Roadmap', Route]];
const slug = value => statuses.indexOf(value);
const history = item => item.messages || [
  {role: 'assistant', text: 'Olá! Conte com suas palavras o que aconteceu.'},
  {role: 'client', text: item.report},
  {role: 'handoff', lawyer: item.lawyer},
];
const pendingDocs = item => !item.docs?.length && item.status !== 'Concluído';
const badge = item => <span className={'status s' + slug(item.status)}><i/>{item.status}</span>;
const areaClass = area => 'a' + areas.indexOf(area);
const who = key => key === 'parceiros' ? 'Parceiros' : lawyers[key].short;
const ChannelIcon = ({channel, size = 13}) => channel === 'jusponte' ? <Globe size={size}/> : channel === 'site' ? <Scale size={size}/> : <Phone size={size}/>;
const channelTag = channel => <span className={'channel ' + channels[channel].tone}><ChannelIcon channel={channel}/>{channels[channel].label}</span>;

export default function Panel({records, setRecords, onOpenDemo, incoming, clearIncoming}) {
  const [page, setPage] = useState(incoming ? 'Atendimentos' : 'Visão geral');
  const [selected, setSelected] = useState(incoming || records[0]?.id);
  const [tab, setTab] = useState('Resumo');
  const [filter, setFilter] = useState('Todos');
  const [area, setArea] = useState('');
  const [channel, setChannel] = useState('');
  const [lawyer, setLawyer] = useState('');
  const [search, setSearch] = useState('');
  const [drawer, setDrawer] = useState(!!incoming);
  const [menu, setMenu] = useState(false);
  const [help, setHelp] = useState(false);
  const [bell, setBell] = useState(false);
  const [reply, setReply] = useState('');
  const [showCpf, setShowCpf] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    if (!incoming) return;
    const item = records.find(record => record.id === incoming);
    if (item) notify('Novo atendimento recebido', `${item.name} · ${channels[item.channel].label} · ${who(item.lawyer)}`);
    clearIncoming();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const sorted = [...records].sort((a, b) => b.createdAt - a.createdAt);
  const visible = sorted.filter(item => (!area || item.area === area) && (!channel || item.channel === channel) && (!lawyer || item.lawyer === lawyer) &&
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
    setPage(next); setMenu(false); setDrawer(false); setFilter('Todos'); setSearch(''); setArea(''); setChannel(''); setLawyer(''); setBell(false);
    window.scrollTo?.(0, 0);
  }
  function goTo(item, nextTab) { navigate('Atendimentos'); open(item, nextTab); }
  function showList(changes) {
    navigate('Atendimentos');
    if (changes.filter) setFilter(changes.filter);
    if (changes.channel) setChannel(changes.channel);
    if (changes.lawyer) setLawyer(changes.lawyer);
  }
  function takeOver(item) {
    patch(item.id, {status: 'Em atendimento', unread: false});
    setFilter('Todos'); setTab('Conversa');
    notify(`${who(item.lawyer)} assumiu o atendimento`, 'A assistente virtual foi pausada nesta conversa.');
  }
  function transfer(item, target) {
    if (target === item.lawyer) return;
    patch(item.id, {lawyer: target, messages: [...history(item), {role: 'handoff', lawyer: target}]});
    notify('Atendimento transferido', `${item.name} agora está com ${lawyers[target].name}.`);
  }
  function requestDocs(item) {
    const text = `Olá, ${firstName(item.name)}! Para darmos andamento ao seu atendimento, pode enviar por aqui foto ou PDF de:\n• ${suggestedDocs(item.area).join('\n• ')}`;
    patch(item.id, {messages: [...history(item), {role: item.status === 'Em atendimento' ? 'lawyer' : 'assistant', text}], docsRequested: true});
    notify('Pedido de documentos enviado', `Mensagem enviada para ${firstName(item.name)} pelo WhatsApp (simulado).`);
  }
  async function copySummary(item) {
    const text = [`ATENDIMENTO · ${item.name}`, `Origem: ${channels[item.channel].label} · Responsável: ${lawyers[item.lawyer].name}`, `Área: ${item.area} · ${item.subject}`,
      `WhatsApp: ${item.phone || '-'} · Cidade: ${item.city || '-'}`, item.urgent ? `PRAZO: ${item.deadline}` : null, '', `Relato: ${item.report}`, '',
      ...(item.answers || []).map(([key, value]) => `${key}: ${value}`), '', `Documentos: ${item.docs?.length ? item.docs.join(', ') : 'nenhum'}`].filter(line => line !== null).join('\n');
    try { await navigator.clipboard.writeText(text); notify('Resumo copiado', 'Cole no sistema do escritório ou envie para a equipe.'); }
    catch { notify('Não foi possível copiar', 'O navegador bloqueou o acesso à área de transferência.'); }
  }
  function resetDemo() {
    setRecords(makeSeed()); setHelp(false); navigate('Visão geral');
    notify('Demonstração restaurada', 'Os atendimentos de exemplo foram recarregados.');
  }

  const metrics = [
    ['Total de atendimentos', records.length, Inbox, 'green', {filter: 'Todos'}],
    ['Aguardando advogado', records.filter(item => item.status === 'Para assumir').length, Clock3, 'sand', {filter: 'Para assumir'}],
    ['Casos urgentes', records.filter(item => item.urgent && item.status !== 'Concluído').length, TriangleAlert, 'rose', {filter: 'Urgentes'}],
    ['Documentos pendentes', records.filter(pendingDocs).length, FileWarning, 'mint', {filter: 'Documentos pendentes'}],
  ];
  const metricRow = <section className="metrics" aria-label="Indicadores">{metrics.map(([label, count, Icon, color, target]) => <button className="metric" key={label} onClick={() => showList(target)}><span className={'metricIcon ' + color}><Icon size={19}/></span><span><small>{label}</small><strong>{count}</strong></span></button>)}</section>;
  const select = (label, value, setter, options) => <label><select aria-label={label} value={value} onChange={event => setter(event.target.value)}>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select><ChevronDown size={14}/></label>;

  return <div className="app">
    {menu && <div className="mobileShade" onClick={() => setMenu(false)}/>}
    <aside className={'sidebar' + (menu ? ' expanded' : '')}>
      <div className="brand"><div className="brandIcon"><Scale size={24}/></div><div><strong>MACENA</strong><small>ADVOGADOS</small></div><button className="iconButton closeMenu" aria-label="Fechar menu" onClick={() => setMenu(false)}><X size={20}/></button></div>
      <nav aria-label="Menu principal"><div className="navCaption">ESCRITÓRIO</div>{nav.map(([label, Icon]) => <button key={label} className={page === label ? 'navItem active' : 'navItem'} aria-current={page === label ? 'page' : undefined} onClick={() => navigate(label)}><Icon size={19}/>{label}{label === 'Atendimentos' && unread.length > 0 && <span className="navCount">{unread.length}</span>}</button>)}
        <div className="navCaption second">CANAIS</div>
        {Object.entries(channels).map(([key, data]) => <button key={key} className="navItem" onClick={() => onOpenDemo(key)}><ChannelIcon channel={key} size={18}/>{data.label}<ChevronRight size={15} className="navArrow"/></button>)}</nav>
      <div className="sidebarBottom"><button className="navItem" onClick={() => { setHelp(true); setMenu(false); }}><CircleHelp size={19}/> Ajuda</button>
        <div className="account"><div className="avatar staff">{initials(account.name)}</div><div><strong>{account.name}</strong><small>{account.role}</small></div></div></div>
    </aside>
    <div className="body">
      <header className="top">
        <div><button className="iconButton mobileMenu" aria-label="Abrir menu" onClick={() => setMenu(true)}><Menu size={22}/></button><span className="crumb">Painel do escritório</span><span className="slash crumb">/</span><strong>{page}</strong></div>
        <div className="topActions">
          <div className="bellWrap">
            <button className="iconButton bell" aria-label={`Notificações: ${unread.length} novas`} aria-expanded={bell} onClick={() => setBell(value => !value)}><Bell size={20}/>{unread.length > 0 && <span className="bellCount">{unread.length}</span>}</button>
            {bell && <div className="bellMenu" role="menu"><strong className="bellTitle">Novos atendimentos</strong>
              {unread.length ? unread.map(item => <button key={item.id} role="menuitem" className="bellItem" onClick={() => goTo(item)}><span className={'avatar ' + areaClass(item.area)}>{initials(item.name)}</span><span><strong>{item.name}</strong><small>{channels[item.channel].label} · {item.area} · {when(item.createdAt)}</small></span>{item.urgent && <TriangleAlert className="urgentIcon" size={15}/>}</button>)
                : <p className="empty">Nenhuma novidade por enquanto.</p>}</div>}
          </div>
        </div>
      </header>
      <main>
      {page === 'Visão geral' && <Overview records={sorted} metricRow={metricRow} onOpen={goTo} onList={showList} onOpenDemo={onOpenDemo}/>}

      {page === 'Atendimentos' && <>
        <div className="heading"><div><h1>Central de atendimento</h1><p>Casos vindos do {PLATFORM}, do site e do WhatsApp, já encaminhados ao advogado certo.</p></div></div>
        {metricRow}
        <section className={'inbox' + (drawer ? ' drawerOpen' : '')}>
          <div className="queue"><div className="queueHead"><h2>Conversas <span>{visible.length}</span></h2>
            <label className="search"><Search size={17}/><input placeholder="Buscar por nome, assunto ou cidade…" aria-label="Buscar conversas" value={search} onChange={event => setSearch(event.target.value)}/></label>
            <div className="filters">
              {select('Status', filter, setFilter, ['Todos', ...statuses, 'Urgentes', 'Documentos pendentes'].map(value => [value, value === 'Todos' ? 'Todos os status' : value]))}
              {select('Advogado', lawyer, setLawyer, [['', 'Todos os advogados'], ...Object.entries(lawyers).map(([key, data]) => [key, data.name])])}
            </div>
            <div className="filters">
              {select('Canal', channel, setChannel, [['', 'Todos os canais'], ...Object.entries(channels).map(([key, data]) => [key, data.label])])}
              {select('Área jurídica', area, setArea, [['', 'Todas as áreas'], ...[...areas, 'A classificar'].map(value => [value, value])])}
            </div></div>
          <div>{visible.map(item => <button className={'person' + (current?.id === item.id ? ' chosen' : '') + (item.unread ? ' unread' : '')} key={item.id} onClick={() => open(item)}><span className={'avatar ' + areaClass(item.area)}>{initials(item.name)}</span><span className="personText"><strong>{item.name}</strong><small>{item.area} · {who(item.lawyer)}</small><span className="personMeta">{badge(item)}{channelTag(item.channel)}{item.urgent && item.status !== 'Concluído' && <TriangleAlert className="urgentIcon" size={14} aria-label="Urgente"/>}</span></span><time>{when(item.createdAt)}{item.unread && <i className="dot" aria-label="Não lido"/>}</time></button>)}
          {!visible.length && <p className="empty">Nenhuma conversa encontrada.</p>}</div></div>

          <div className="detail">{current ? <>
            <div className="detailHead"><button className="iconButton closeDrawer" aria-label="Voltar às conversas" onClick={() => setDrawer(false)}><ChevronRight size={20} style={{transform: 'rotate(180deg)'}}/></button><div className={'avatar large ' + areaClass(current.area)}>{initials(current.name)}</div><div className="identity"><h2>{current.name}</h2><small><ChannelIcon channel={current.channel} size={14}/> {channels[current.channel].label} <b>·</b> {current.city || 'Cidade não informada'} <b>·</b> {when(current.createdAt)}</small></div>
              <button className="secondary copy" onClick={() => copySummary(current)} title="Copiar resumo"><Copy size={16}/><span>Copiar resumo</span></button></div>
            <div className="tabs" role="group" aria-label="Detalhes do atendimento">{['Resumo', 'Conversa', 'Documentos'].map(label => <button key={label} className={tab === label ? 'selectedTab' : ''} aria-pressed={tab === label} onClick={() => setTab(label)}>{label}{label === 'Documentos' && current.docs?.length ? <span>{current.docs.length}</span> : null}</button>)}</div>
            <div className="detailBody">
              {current.status === 'Em atendimento' && <div className="control"><Headset size={18}/><p><strong>{lawyers[current.lawyer].name} está no controle.</strong> A assistente virtual está pausada nesta conversa.</p></div>}
              {tab === 'Resumo' && <>
                {current.urgent && current.status !== 'Concluído' && <div className="alert"><TriangleAlert size={19}/><div><strong>Prazo sinalizado</strong><p>{current.deadline || 'O cliente relatou urgência no atendimento.'}</p></div></div>}
                <div className="routing"><LawyerAvatar lawyer={current.lawyer} size="large"/><div><small>Encaminhado para</small><strong>{lawyers[current.lawyer].name}</strong><span>{lawyers[current.lawyer].title}</span></div>
                  <label className="transfer"><ArrowLeftRight size={15}/><select aria-label="Transferir para outro advogado" value={current.lawyer} onChange={event => transfer(current, event.target.value)}>{Object.entries(lawyers).map(([key, data]) => <option key={key} value={key}>{key === current.lawyer ? 'Transferir…' : data.name}</option>)}</select></label></div>
                <div className="summaryTitle"><span className="metricIcon green"><MessageSquareText size={17}/></span><h3>Resumo da triagem</h3></div>
                <div className="information">
                  <div><small>Área jurídica</small><strong className="areaTag">{current.area}</strong></div>
                  <div><small>Assunto</small><strong>{current.subject}</strong></div>
                  <div><small>Origem</small>{channelTag(current.channel)}</div>
                  <div><small>WhatsApp</small><strong>{current.phone || 'Não informado'}</strong></div>
                  <div><small>Cidade</small><strong>{current.city || 'Não informada'}</strong></div>
                  <div><small>CPF</small><strong className="cpf">{showCpf && current.cpf ? formatCpf(current.cpf) : maskCpf(current.cpf)}{current.cpf && <button className="iconButton" aria-label={showCpf ? 'Ocultar CPF' : 'Mostrar CPF'} onClick={() => setShowCpf(value => !value)}>{showCpf ? <EyeOff size={15}/> : <Eye size={15}/>}</button>}</strong></div>
                  <div><small>Status</small>{badge(current)}</div>
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
                <input aria-label="Mensagem do advogado" placeholder="Responder ao cliente…" value={reply} onChange={event => setReply(event.target.value)}/><button className="primary" aria-label="Enviar resposta" disabled={!reply.trim()}><Send size={16}/></button></form>
              <button className="secondary" onClick={() => { patch(current.id, {status: 'Concluído'}); setFilter('Todos'); notify('Atendimento concluído', current.name); }}><Check size={16}/> Concluir</button></>
              : current.status === 'Concluído' ? <button className="secondary" onClick={() => { patch(current.id, {status: 'Em atendimento'}); setFilter('Todos'); }}>Reabrir atendimento</button>
              : <button className="primary" onClick={() => takeOver(current)}><Headset size={17}/> Assumir atendimento</button>}</div>
          </> : <p className="empty">Selecione uma conversa para visualizar o atendimento.</p>}</div>
        </section>
      </>}

      {page === 'Clientes' && <Clients records={sorted} search={search} setSearch={setSearch} onOpen={goTo}/>}
      {page === 'Documentos' && <DocumentsPage records={sorted} search={search} setSearch={setSearch} onOpen={goTo} onRequest={requestDocs}/>}
      {page === 'Roadmap' && <Roadmap/>}
      </main>
    </div>

    {toast && <div className="toast" role="status"><span className="metricIcon green"><Check size={16}/></span><div><strong>{toast.title}</strong><small>{toast.text}</small></div><button className="iconButton" aria-label="Fechar aviso" onClick={() => setToast(null)}><X size={16}/></button></div>}
    {help && <div className="overlay" onClick={() => setHelp(false)}><section className="dialog" role="dialog" aria-modal="true" aria-label="Sobre a demonstração" onClick={event => event.stopPropagation()}>
      <button autoFocus className="iconButton" aria-label="Fechar ajuda" onClick={() => setHelp(false)}><X size={20}/></button>
      <h2>Sobre a demonstração</h2>
      <p>Protótipo das três frentes: a plataforma nacional {PLATFORM}, o site do Macena Advogados e o WhatsApp do escritório. Todas alimentam este painel. A triagem usa regras locais no lugar da inteligência artificial e os dados ficam somente neste navegador. Use apenas dados fictícios.</p>
      <div className="dialogActions"><button className="primary" onClick={() => onOpenDemo('jusponte')}>Abrir o {PLATFORM}</button><button className="secondary" onClick={resetDemo}>Restaurar dados de exemplo</button></div>
    </section></div>}
  </div>;
}

function Overview({records, metricRow, onOpen, onList, onOpenDemo}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const attention = records.filter(item => item.status === 'Para assumir' || (item.urgent && item.status !== 'Concluído'))
    .sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0)).slice(0, 5);
  const night = records.filter(item => afterHours(item.createdAt)).length;
  const byChannel = Object.keys(channels).map(key => [key, records.filter(item => item.channel === key).length]);
  const byLawyer = Object.keys(lawyers).map(key => [key, records.filter(item => item.lawyer === key).length]);
  const states = Object.entries(records.reduce((all, item) => { const uf = (item.city || '').match(/[A-Z]{2}$/)?.[0]; if (uf) all[uf] = (all[uf] || 0) + 1; return all; }, {})).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...byLawyer.map(([, count]) => count));
  return <>
    <div className="heading"><div><h1>{greeting}, {firstName(account.name)}</h1><p>{new Date().toLocaleDateString('pt-BR', {weekday: 'long', day: 'numeric', month: 'long'})} · Atendimentos de todos os canais.</p></div></div>
    <section className="channelCards">{byChannel.map(([key, count]) => <div key={key} className={'channelCard ' + channels[key].tone}>
      <button className="channelMain" onClick={() => onList({channel: key})} aria-label={`Ver ${count} atendimentos do ${channels[key].label}`}>
        <span className="channelIcon">{key === 'jusponte' ? <BridgeMark size={22}/> : <ChannelIcon channel={key} size={20}/>}</span>
        <span><small>{channels[key].detail}</small><strong>{channels[key].label}</strong></span><b>{count}</b></button>
      <button className="channelOpen" onClick={() => onOpenDemo(key)}>Abrir canal <ChevronRight size={14}/></button></div>)}</section>
    {metricRow}
    <section className="overview">
      <div className="card attention"><div className="cardHead"><h2>Precisam de atenção</h2><button className="link" onClick={() => onList({filter: 'Para assumir'})}>Ver todos</button></div>
        {attention.map(item => <button key={item.id} className="directoryRow" onClick={() => onOpen(item)}><span className={'avatar ' + areaClass(item.area)}>{initials(item.name)}</span><span><strong>{item.name}</strong><small>{channels[item.channel].label} · {who(item.lawyer)} · {item.urgent ? item.deadline : item.subject}</small></span>{item.urgent ? <span className="status hot"><TriangleAlert size={12}/> Prazo</span> : badge(item)}</button>)}
        {!attention.length && <p className="empty">Tudo em dia. Nenhum atendimento aguardando.</p>}</div>
      <div className="card"><div className="cardHead"><h2>Casos por advogado</h2></div>
        <div className="bars">{byLawyer.map(([key, count]) => <button key={key} className="bar lawyerBar" onClick={() => onList({lawyer: key})}><span className="barName"><LawyerAvatar lawyer={key}/>{lawyers[key].name}</span><span className="track"><span className={lawyers[key].tone} style={{width: count / max * 100 + '%'}}/></span><strong>{count}</strong></button>)}</div></div>
      <div className="card nightCard"><span className="metricIcon sand"><Moon size={19}/></span><strong>{night}</strong><p>atendimentos recebidos <b>fora do horário comercial</b>, já triados pela assistente.</p></div>
      <div className="card"><div className="cardHead"><h2>Origem dos clientes</h2><small className="muted">{states.length} estados</small></div>
        <div className="states">{states.map(([uf, count]) => <span key={uf}><b>{uf}</b>{count}</span>)}</div></div>
    </section>
  </>;
}

function Chat({messages}) {
  return <div className="chat" role="log" aria-label="Histórico de mensagens">{messages.map(({role, text, file, audio, lawyer}, index) => role === 'handoff'
    ? <div key={index} className="handoffLine"><ArrowLeftRight size={14}/> Encaminhado para <strong>{lawyers[lawyer].name}</strong></div>
    : <div key={index} className={'bubble ' + role}>
      <small>{role === 'client' ? <UserRound size={13}/> : role === 'lawyer' ? <Scale size={13}/> : <Bot size={14}/>} {role === 'client' ? 'Cliente' : role === 'lawyer' ? 'Advogado' : 'Assistente virtual'}{audio && <> · <Mic size={12}/> áudio transcrito</>}</small>
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
    <div className="heading"><div><h1>Clientes</h1><p>Cadastro criado automaticamente a partir dos atendimentos de todos os canais.</p></div></div>
    <div className="directory"><label className="search"><Search size={17}/><input aria-label="Buscar clientes" placeholder="Buscar por nome, cidade ou telefone…" value={search} onChange={event => setSearch(event.target.value)}/></label>
      {groups.map(client => <button className="directoryRow" key={client.id} onClick={() => onOpen(client.cases[0])}><span className={'avatar ' + areaClass(client.area)}>{initials(client.name)}</span>
        <span><strong>{client.name}</strong><small>{client.city || 'Cidade não informada'} · {client.phone}</small></span>
        {channelTag(client.channel)}<span className="cases">{client.cases.length} atendimento{client.cases.length > 1 ? 's' : ''}</span></button>)}
      {!groups.length && <p className="empty">Nenhum cliente encontrado.</p>}</div>
  </>;
}

function DocumentsPage({records, search, setSearch, onOpen, onRequest}) {
  const term = normalize(search.trim());
  const received = records.flatMap(item => (item.docs || []).map(doc => ({doc, item}))).filter(({doc, item}) => normalize(doc + ' ' + item.name).includes(term));
  const pending = records.filter(pendingDocs).filter(item => normalize(item.name).includes(term));
  return <>
    <div className="heading"><div><h1>Documentos</h1><p>Arquivos recebidos e clientes que ainda precisam enviar documentos.</p></div></div>
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

const fronts = [
  ['1º', 'WhatsApp do escritório', 'Começar por aqui', 'A secretária virtual responde na hora e adianta o atendimento até o Dr. Paulo assumir. Usa o número que os clientes já conhecem, então gera resultado desde o primeiro dia.', [['Triagem e perguntas por área', true], ['Advogado assume a conversa', true], ['Conexão com a API oficial do WhatsApp', false], ['Transcrição de áudios recebidos', false]]],
  ['2º', 'Site Macena Advogados', 'Mesmo motor', 'O mesmo cérebro da triagem, com a cara do escritório. Quem chega já sabe que vai falar com o Dr. Paulo, o Dr. Luiz ou o Dr. Nick.', [['Página com especialidades e equipe', true], ['Bate-papo com encaminhamento por advogado', true], ['Domínio, hospedagem e SEO local', false]]],
  ['3º', `${PLATFORM} (plataforma nacional)`, 'Maior alcance', 'Captação no Brasil inteiro pelo Google, sem a marca do escritório. Casos fora das especialidades vão para uma rede de parceiros.', [['Página nacional com buscas e áreas', true], ['Encaminhamento: cível → Paulo, trabalhista → Luiz, penal → Nick', true], ['Rede de parceiros e regras de repasse', false], ['SEO nacional, marca e domínio', false], ['Análise de conformidade com a OAB', false]]],
];

function Roadmap() {
  return <>
    <div className="heading"><div><h1>Roadmap do projeto</h1><p>Três frentes, um único motor de triagem e um único painel.</p></div></div>
    <div className="card architecture"><h2>Como as frentes se conectam</h2>
      <div className="arch">
        <div className="archCol">{Object.entries(channels).map(([key, data]) => <span key={key} className={'channel big ' + data.tone}><ChannelIcon channel={key} size={16}/>{data.label}</span>)}</div>
        <ChevronRight className="archArrow" size={22}/>
        <div className="archCore"><Sparkles size={20}/><strong>Assistente com IA</strong><small>Entende o caso, identifica a área e coleta os dados</small></div>
        <ChevronRight className="archArrow" size={22}/>
        <div className="archCol">{['paulo', 'luiz', 'nick', 'parceiros'].map(key => <span key={key} className="archLawyer"><LawyerAvatar lawyer={key}/>{lawyers[key].name}</span>)}</div>
      </div></div>
    <section className="phases three">{fronts.map(([order, title, tag, text, items]) => <article className="card phase" key={title}>
      <div className="phaseHead"><small>{order} a lançar</small><span className={'phaseTag ' + (order === '1º' ? 'prioridade' : 'demonstrado')}>{tag}</span></div><h2>{title}</h2><p className="phaseText">{text}</p>
      <ul>{items.map(([item, demo]) => <li key={item} className={demo ? 'yes' : ''}>{demo ? <CheckCircle2 size={16}/> : <Clock3 size={16}/>}<span>{item}<small>{demo ? 'Nesta demonstração' : 'Implementação de produção'}</small></span></li>)}</ul></article>)}</section>
    <section className="principles">{[[BadgeCheck, 'Transparência', 'A assistente se apresenta como assistente do advogado. O cliente sente que está sendo atendido pelo especialista, sem ser enganado.'], [ShieldCheck, 'Sigilo e LGPD', 'Controle de acesso, dados criptografados e consentimento. Na plataforma nacional, só o necessário é coletado.'], [Headset, 'Advogado no controle', 'A IA organiza e encaminha; orientação jurídica e decisões ficam com o profissional.']].map(([Icon, title, text]) => <div className="card principle" key={title}><span className="metricIcon green"><Icon size={19}/></span><h3>{title}</h3><p>{text}</p></div>)}</section>
    <div className="card decision"><CircleHelp size={22}/><div><h3>Atenção antes de lançar o {PLATFORM}</h3><p>As regras da OAB sobre publicidade (Provimento 205/2021) proíbem a <b>captação de clientela</b> e a <b>mercantilização</b> da advocacia. Vale validar com um especialista em ética da OAB como a plataforma vai se apresentar, como os casos serão repassados aos parceiros e como a IA se identifica.</p></div></div>
  </>;
}
