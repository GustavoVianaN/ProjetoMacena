import React, {useState} from 'react';
import {Scale, UserRound, Lock, Eye, EyeOff, ArrowRight, LoaderCircle, Clock3, Sparkles, ShieldCheck, CheckCheck} from 'lucide-react';
import {users, normalize} from './data';

const features = [
  [Clock3, 'Atendimento 24 horas', 'Clientes recebidos pelo WhatsApp a qualquer hora, inclusive fins de semana e feriados.'],
  [Sparkles, 'Triagem inteligente', 'Identifica a área jurídica e faz as perguntas certas para cada caso.'],
  [ShieldCheck, 'Advogado no controle', 'A equipe assume a conversa quando quiser. Decisões jurídicas ficam com o profissional.'],
];

export default function Login({onLogin}) {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(false);

  function submit(event) {
    event.preventDefault();
    if (!user.trim() || !password) {
      setError('Informe seu usuário e sua senha.');
      setAttempt(count => count + 1);
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      const login = normalize(user.trim());
      if (users[login]?.password === password) return onLogin(login, remember);
      setLoading(false);
      setError('Usuário ou senha incorretos. Confira os dados e tente novamente.');
      setAttempt(count => count + 1);
    }, 700);
  }

  return <div className="login">
    <section className="loginHero">
      <div className="brand"><div className="brandIcon"><Scale size={24}/></div><div><strong>MACENA</strong><small>ADVOGADOS</small></div></div>
      <div className="heroCopy">
        <span className="eyebrow">Central de atendimento inteligente</span>
        <h1>O primeiro atendimento do escritório, a <em>qualquer hora</em>.</h1>
        <p>A assistente virtual recebe o cliente pelo WhatsApp, entende o caso e entrega tudo organizado para a equipe jurídica.</p>
      </div>
      <div className="heroPreview" aria-hidden="true">
        <div className="previewHead"><span className="previewDot"><Scale size={14}/></span><div><strong>Macena Advogados</strong><small>online</small></div><span className="previewTime">23:14</span></div>
        <p className="previewBubble client">Fui mandado embora e não recebi meus direitos. O que eu faço?</p>
        <p className="previewBubble">Sinto muito por isso. Vou fazer algumas perguntas rápidas para que um advogado já receba seu caso organizado.<CheckCheck size={14}/></p>
        <div className="previewTags"><span>Trabalhista</span><span className="hot">Prazo sinalizado</span></div>
      </div>
      <ul className="heroFeatures">{features.map(([Icon, title, text]) => <li key={title}><span><Icon size={18}/></span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ul>
      <small className="heroFoot">© 2026 Macena Advogados · Cível, Família, Previdenciário e Trabalhista</small>
    </section>

    <section className="loginPanel">
      <form key={attempt} className={'loginCard' + (attempt && error ? ' shake' : '')} onSubmit={submit} noValidate>
        <div className="loginMark"><Scale size={22}/></div>
        <h2>Bem-vindo de volta</h2>
        <p className="loginLead">Entre para acessar a central de atendimento do escritório.</p>
        <label className="field"><span>Usuário</span>
          <div className="inputWrap"><UserRound size={18}/><input autoFocus autoComplete="username" autoCapitalize="none" spellCheck="false" placeholder="Seu usuário" value={user} onChange={event => setUser(event.target.value)}/></div>
        </label>
        <label className="field"><span>Senha</span>
          <div className="inputWrap"><Lock size={18}/><input type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="Sua senha" value={password} onChange={event => setPassword(event.target.value)}/>
            <button type="button" className="reveal" aria-label={show ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShow(value => !value)}>{show ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
        </label>
        <div className="loginRow">
          <label className="check"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)}/><span/>Manter conectado</label>
          <button type="button" className="link" onClick={() => setError('Para redefinir a senha, fale com o administrador do sistema.')}>Esqueci a senha</button>
        </div>
        {error && <p className="loginError" role="alert">{error}</p>}
        <button className="primary loginButton" disabled={loading}>{loading ? <span key="loading" className="buttonContent"><LoaderCircle className="spin" size={18}/><span>Entrando…</span></span> : <span key="idle" className="buttonContent"><span>Entrar</span><ArrowRight size={18}/></span>}</button>
        <p className="secure"><ShieldCheck size={15}/> Acesso restrito à equipe do Macena Advogados</p>
      </form>
      <span className="demoNote"><i/> Ambiente de demonstração</span>
    </section>
  </div>;
}
