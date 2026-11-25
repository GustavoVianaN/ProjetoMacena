import React, {useState} from 'react';
import {Scale, MessageCircle, Search, ShieldCheck, Clock3, MapPin, ArrowRight, BadgeCheck, Briefcase, Gavel, HeartHandshake, Landmark, House, ShoppingBag, Users, ChevronDown, Sparkles, Phone} from 'lucide-react';
import {WebChat, LawyerAvatar} from './Chat';
import {PLATFORM, lawyers} from './data';

const jump = id => event => { event.preventDefault(); document.getElementById(id)?.scrollIntoView({behavior: 'smooth'}); };

function useChat() {
  const [chat, setChat] = useState({open: false, session: 0, starter: ''});
  return {
    chat,
    start: starter => setChat(current => ({open: true, session: current.session + 1, starter})),
    open: () => setChat(current => current.session ? {...current, open: true} : {open: true, session: 1, starter: ''}),
    close: () => setChat(current => ({...current, open: false})),
    restart: () => setChat(current => ({open: true, session: current.session + 1, starter: ''})),
  };
}

export function BridgeMark({size = 26}) {
  return <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="currentColor"/><path d="M5 21c3.5-8 18.5-8 22 0" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"/><path d="M5 21h22M10 21v-4.2M16 21v-5.6M22 21v-4.2" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>;
}

const jpAreas = [
  [Briefcase, 'Trabalhista', 'Demissão, verbas, horas extras, assédio'],
  [Gavel, 'Penal', 'Prisão, flagrante, defesa criminal, medidas protetivas'],
  [House, 'Cível e imóveis', 'Contratos, indenizações, usucapião, escritura'],
  [HeartHandshake, 'Família', 'Divórcio, pensão, guarda, inventário'],
  [Landmark, 'Previdenciário', 'Aposentadoria, INSS, BPC/LOAS, auxílios'],
  [ShoppingBag, 'Consumidor e outras', 'Bancos, voos, compras e mais, com parceiros'],
];
const searches = [
  ['advogado trabalhista online', 'Fui demitido e a empresa não pagou minha rescisão'],
  ['advogado criminal urgente', 'Meu filho foi preso ontem à noite e não sei o que fazer'],
  ['advogado INSS aposentadoria', 'O INSS negou minha aposentadoria'],
  ['advogado divórcio', 'Quero me divorciar e temos dois filhos'],
  ['advogado usucapião', 'Moro há 20 anos num terreno sem escritura'],
  ['advogado voo cancelado', 'A companhia aérea cancelou meu voo e não me reembolsou'],
];
const faq = [
  ['É gratuito?', 'Contar seu caso e ser direcionado a um especialista não tem custo. Os honorários são combinados diretamente com o advogado, se você decidir contratar.'],
  ['Estou falando com um advogado?', 'O primeiro atendimento é feito por uma assistente virtual que entende e organiza seu caso. Em seguida, o advogado especialista assume a conversa pelo WhatsApp.'],
  ['Atende em todo o Brasil?', 'Sim. Os atendimentos são online e os especialistas atuam em processos de todos os estados.'],
  ['Meus dados ficam seguros?', 'Sim. As informações são sigilosas, usadas apenas para o seu atendimento e tratadas conforme a LGPD.'],
];

export function JusPonte({onSave, onPanel}) {
  const {chat, start, open, close, restart} = useChat();
  const [story, setStory] = useState('');
  const brand = {name: PLATFORM, subtitle: 'Advogados especialistas · todo o Brasil', icon: <BridgeMark size={30}/>};
  return <div className="site jp">
    <header className="siteNav"><a className="siteLogo" href="#/jusponte"><BridgeMark/><strong>Jus<span>Ponte</span></strong></a>
      <nav><a href={"#" + "jp-como"} onClick={jump("jp-como")}>Como funciona</a><a href={"#" + "jp-areas"} onClick={jump("jp-areas")}>Áreas</a><a href={"#" + "jp-especialistas"} onClick={jump("jp-especialistas")}>Especialistas</a><a href={"#" + "jp-duvidas"} onClick={jump("jp-duvidas")}>Dúvidas</a></nav>
      <button className="siteCta" onClick={open}>Contar meu caso</button></header>

    <section className="jpHero">
      <div className="jpHeroText">
        <span className="pill"><MapPin size={14}/> Atendimento online em todo o Brasil</span>
        <h1>Precisa de um advogado? <em>Conte seu caso</em> e fale com um especialista.</h1>
        <p>Explique com suas palavras. Nossa assistente entende o problema e conecta você ao advogado certo para a sua causa, em poucos minutos.</p>
        <form className="storyBox" onSubmit={event => { event.preventDefault(); start(story.trim()); setStory(''); }}>
          <textarea rows={3} value={story} onChange={event => setStory(event.target.value)} placeholder="Ex.: Fui demitido sem justa causa e não recebi minha rescisão…" aria-label="Conte o que aconteceu"/>
          <div><small><ShieldCheck size={14}/> Sigiloso e sem compromisso</small><button className="jpButton">Falar com especialista <ArrowRight size={17}/></button></div>
        </form>
        <ul className="trust"><li><Clock3 size={16}/> Resposta rápida, 24 horas</li><li><BadgeCheck size={16}/> Advogados especialistas</li><li><MapPin size={16}/> 27 estados</li></ul>
      </div>
      <div className="jpHeroArt" aria-hidden="true">
        <div className="artCard">
          <div className="artHead"><BridgeMark size={22}/><div><strong>{PLATFORM}</strong><small>online agora</small></div></div>
          <p className="artBubble me">Meu irmão foi preso em flagrante. A audiência de custódia é hoje!</p>
          <p className="artBubble">Entendi, é um caso de Direito Penal. Vou conectar você com o Dr. Nick, especialista no assunto.</p>
          <div className="handoff mini"><LawyerAvatar lawyer="nick"/><div><small>Seu especialista</small><strong>{lawyers.nick.name}<BadgeCheck size={14}/></strong><span>{lawyers.nick.title}</span></div></div>
        </div>
        <div className="artStat"><strong>3 min</strong><small>até o especialista receber o caso</small></div>
      </div>
    </section>

    <section className="jpSearches"><h2><Search size={18}/> Buscas frequentes</h2><div>{searches.map(([label, text]) => <button key={label} onClick={() => start(text)}>{label}</button>)}</div></section>

    <section className="jpSection" id="jp-como"><span className="kicker">Como funciona</span><h2>Do problema ao especialista em três passos</h2>
      <ol className="jpSteps">{[[MessageCircle, 'Conte o que aconteceu', 'Escreva ou mande áudio, do seu jeito. Não precisa saber termos jurídicos.'], [Sparkles, 'A assistente entende o caso', 'Ela identifica a área do Direito e faz as perguntas certas para adiantar o atendimento.'], [BadgeCheck, 'Fale com o especialista', 'O advogado da área recebe tudo organizado e continua com você pelo WhatsApp.']].map(([Icon, title, text], index) => <li key={title}><span className="stepNum">{index + 1}</span><Icon size={22}/><h3>{title}</h3><p>{text}</p></li>)}</ol></section>

    <section className="jpSection alt" id="jp-areas"><span className="kicker">Áreas de atuação</span><h2>Qual é o seu problema?</h2>
      <div className="jpAreas">{jpAreas.map(([Icon, title, text]) => <button key={title} onClick={() => start(text.split(',')[0])}><Icon size={22}/><strong>{title}</strong><small>{text}</small><ArrowRight size={16}/></button>)}</div></section>

    <section className="jpSection" id="jp-especialistas"><span className="kicker">Especialistas</span><h2>Quem vai cuidar do seu caso</h2>
      <div className="jpLawyers">{['paulo', 'luiz', 'nick', 'parceiros'].map(key => <article key={key}><LawyerAvatar lawyer={key} size="xl"/><h3>{lawyers[key].name}</h3><p>{lawyers[key].title}</p>{key === 'parceiros' && <small>Advogados selecionados para as demais áreas</small>}</article>)}</div></section>

    <section className="jpSection alt" id="jp-duvidas"><span className="kicker">Dúvidas</span><h2>Perguntas frequentes</h2>
      <div className="faq">{faq.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={18}/></summary><p>{answer}</p></details>)}</div></section>

    <section className="jpFinal"><h2>Seu caso merece um especialista.</h2><button className="jpButton light" onClick={open}>Contar meu caso agora <ArrowRight size={17}/></button></section>
    <footer className="siteFoot"><span className="siteLogo"><BridgeMark size={22}/><strong>Jus<span>Ponte</span></strong></span><p>Plataforma de orientação e conexão com advogados. As informações não substituem a consulta com um profissional e não há promessa de resultado.</p></footer>

    {!chat.open && <button className="launcher" onClick={open}><MessageCircle size={22}/><span>Fale com um especialista</span></button>}
    {chat.session > 0 && <WebChat key={chat.session} channel="jusponte" brand={brand} open={chat.open} starter={chat.starter} onClose={close} onRestart={restart} onSave={onSave} onPanel={onPanel}/>}
  </div>;
}

const mcAreas = [
  [House, 'Cível e patrimonial', 'Contratos, cobranças, indenizações, usucapião e regularização de imóveis.', 'paulo'],
  [HeartHandshake, 'Família e sucessões', 'Divórcio, pensão alimentícia, guarda, partilha e inventário.', 'paulo'],
  [Landmark, 'Previdenciário', 'Aposentadorias, benefícios por incapacidade, BPC/LOAS e revisões.', 'paulo'],
  [Briefcase, 'Trabalhista', 'Rescisão, verbas, horas extras, vínculo, assédio e acidentes de trabalho.', 'luiz'],
  [Gavel, 'Penal', 'Defesa criminal, prisões, inquéritos e medidas protetivas.', 'nick'],
];

export function MacenaSite({onSave, onPanel, onWhatsApp}) {
  const {chat, start, open, close, restart} = useChat();
  const brand = {name: 'Macena Advogados', subtitle: 'Atendimento online do escritório', icon: <Scale size={18}/>};
  return <div className="site mc">
    <header className="siteNav"><a className="siteLogo" href="#/macena"><span className="mcMark"><Scale size={20}/></span><span className="mcName"><strong>MACENA</strong><small>ADVOGADOS</small></span></a>
      <nav><a href={"#" + "mc-areas"} onClick={jump("mc-areas")}>Especialidades</a><a href={"#" + "mc-equipe"} onClick={jump("mc-equipe")}>Equipe</a><a href={"#" + "mc-contato"} onClick={jump("mc-contato")}>Contato</a></nav>
      <button className="siteCta" onClick={open}>Fale conosco</button></header>
    <section className="mcHero">
      <div><span className="eyebrow">Advocacia de confiança</span>
        <h1>Atendimento próximo, do primeiro contato à <em>solução</em>.</h1>
        <p>Atuação em Direito Cível, Família, Previdenciário, Trabalhista e Penal. Converse agora com nossa equipe e seja direcionado ao especialista do seu caso.</p>
        <div className="mcActions"><button className="primary big" onClick={open}><MessageCircle size={18}/> Conversar agora</button><button className="secondary big" onClick={onWhatsApp}><Phone size={18}/> Chamar no WhatsApp</button></div></div>
      <div className="mcTeamPeek" aria-hidden="true">{['paulo', 'luiz', 'nick'].map(key => <div key={key}><LawyerAvatar lawyer={key} size="xl"/><strong>{lawyers[key].name}</strong><small>{lawyers[key].title}</small></div>)}</div>
    </section>
    <section className="mcSection" id="mc-areas"><span className="eyebrow">Especialidades</span><h2>Como podemos ajudar</h2>
      <div className="mcAreas">{mcAreas.map(([Icon, title, text, key]) => <article key={title}><Icon size={24}/><h3>{title}</h3><p>{text}</p><button className="link" onClick={() => start(text.split(',')[0])}>Falar com {lawyers[key].short} <ArrowRight size={14}/></button></article>)}</div></section>
    <section className="mcSection dark" id="mc-equipe"><span className="eyebrow">Equipe</span><h2>Quem atende você</h2>
      <div className="mcTeam">{['paulo', 'luiz', 'nick'].map(key => <article key={key}><LawyerAvatar lawyer={key} size="xl"/><h3>{lawyers[key].name}</h3><p>{lawyers[key].title}</p></article>)}</div></section>
    <section className="mcSection" id="mc-contato"><h2>Fale com o escritório</h2><p className="mcLead">Atendimento online 24 horas pelo bate-papo e pelo WhatsApp. Endereço e OAB serão incluídos na versão final.</p>
      <div className="mcActions center"><button className="primary big" onClick={open}><MessageCircle size={18}/> Iniciar conversa</button><button className="secondary big" onClick={onWhatsApp}><Phone size={18}/> WhatsApp</button></div></section>
    <footer className="siteFoot mcFoot"><span>© 2026 Macena Advogados</span><p>As informações deste site têm caráter informativo e não constituem promessa de resultado.</p></footer>

    {!chat.open && <button className="launcher" onClick={open}><MessageCircle size={22}/><span>Converse com o escritório</span></button>}
    {chat.session > 0 && <WebChat key={chat.session} channel="site" brand={brand} open={chat.open} starter={chat.starter} onClose={close} onRestart={restart} onSave={onSave} onPanel={onPanel}/>}
  </div>;
}
