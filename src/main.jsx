import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Scale, Globe, Phone, LayoutDashboard, Presentation} from 'lucide-react';
import {PLATFORM, makeSeed} from './data';
import {JusPonte, MacenaSite} from './Sites';
import {WhatsAppChat} from './Chat';
import Panel from './Panel';
import './style.css';

const STORE = 'macena.demo.v3';
const load = () => { try { return JSON.parse(localStorage.getItem(STORE)) || makeSeed(); } catch { return makeSeed(); } };
const views = {
  jusponte: [PLATFORM, Globe, 'Plataforma nacional'],
  macena: ['Site Macena', Scale, 'Site do escritório'],
  whatsapp: ['WhatsApp', Phone, 'Secretária virtual'],
  painel: ['Painel', LayoutDashboard, 'Escritório'],
};
const current = () => {
  const view = location.hash.replace(/^#\/?/, '').split(/[/?]/)[0];
  return views[view] ? view : 'jusponte';
};

function App() {
  const [view, setView] = useState(current);
  const [records, setRecords] = useState(load);
  const [incoming, setIncoming] = useState(null);

  useEffect(() => {
    const sync = () => { setView(current()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  useEffect(() => { try { localStorage.setItem(STORE, JSON.stringify(records)); } catch { /* A sessão continua em memória. */ } }, [records]);
  useEffect(() => { document.title = `${views[view][0]} · Demonstração`; }, [view]);

  const go = target => { location.hash = '/' + (target === 'site' ? 'macena' : target); };
  function save(record) {
    const item = {...record, id: Date.now(), status: 'Para assumir', unread: true};
    setRecords(list => [item, ...list]);
    setIncoming(item.id);
  }
  const unread = records.filter(item => item.unread).length;

  return <>
    <nav className="demoBar" aria-label="Telas da demonstração">
      <span className="demoLabel"><Presentation size={15}/> Apresentação</span>
      <div className="demoTabs">{Object.entries(views).map(([key, [label, Icon, detail]]) => <a key={key} href={'#/' + key} className={view === key ? 'active' : ''} aria-current={view === key ? 'page' : undefined} title={detail}>
        <Icon size={15}/><span>{label}</span>{key === 'painel' && unread > 0 && <b>{unread}</b>}</a>)}</div>
    </nav>
    <div className="view">
      {view === 'jusponte' && <JusPonte onSave={save} onPanel={() => go('painel')}/>}
      {view === 'macena' && <MacenaSite onSave={save} onPanel={() => go('painel')} onWhatsApp={() => go('whatsapp')}/>}
      {view === 'whatsapp' && <div className="waPage"><div className="heading"><div><span className="eyebrow">Simulação</span><h1>WhatsApp do escritório</h1><p>A secretária virtual atende na hora e adianta o caso até o Dr. Paulo assumir. Ao lado, o que o escritório recebe.</p></div></div>
        <WhatsAppChat onSave={save} onPanel={() => go('painel')}/></div>}
      {view === 'painel' && <Panel records={records} setRecords={setRecords} onOpenDemo={go} incoming={incoming} clearIncoming={() => setIncoming(null)}/>}
    </div>
  </>;
}

// Tradutores automáticos e extensões podem alterar o DOM e derrubar o React.
// Em vez de deixar a tela branca, mostra uma tela para recarregar.
class Recover extends React.Component {
  state = {failed: false};
  static getDerivedStateFromError() { return {failed: true}; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <div className="recover"><div className="recoverMark"><Scale size={22}/></div><h2>Vamos recarregar a página</h2><p>Algo interferiu na exibição, possivelmente o tradutor automático do navegador ou uma extensão. Seus dados estão salvos.</p><button className="primary" onClick={() => location.reload()}>Recarregar</button></div>;
  }
}

createRoot(document.getElementById('root')).render(<Recover><App/></Recover>);
