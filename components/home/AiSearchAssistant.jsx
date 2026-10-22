'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import styles from './AiSearchAssistant.module.css';

const INITIAL_MESSAGE = {
  id: 'name-ask-1',
  sender: 'bot',
  text: '¡Hola! 👋 ¿Cómo estás? Mi nombre es Mónica, y estoy acá para ayudarte a encontrar tu oportunidad ideal. ¿Cómo te llamás?',
};

const FEATURED_ZONES = [
  'Barrio Costa Esmeralda',
  'Olivos',
  'Chapelco Golf & Resort',
  'Nordelta',
  'Palermo',
  'San Martín de los Andes',
];

const ALL_ZONES = [
  'Barrio Costa Esmeralda',
  'Centenario',
  'Centro',
  'Chapelco Golf & Resort',
  'Colón',
  'Libertador al Río',
  'Nordelta',
  'Olivos',
  'Palermo',
  'Recoleta',
  'San Martín de los Andes',
  'Tigre',
  'Vicente López',
];

export default function AiSearchAssistant({ onSelectOperacion }) {
  const router = useRouter();
  const chatThreadRef = useRef(null);
  const [userName, setUserName] = useState('');
  const [inputName, setInputName] = useState('');
  const [customBudgetInput, setCustomBudgetInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState('ask_name'); // 'ask_name' | 'init' | 'operacion' | 'tipo' | 'ubicacion' | 'presupuesto'
  const [selectedOperacion, setSelectedOperacion] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');
  const [selectedUbicacion, setSelectedUbicacion] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [redirectLabel, setRedirectLabel] = useState('Cargando catálogo personalizado...');
  const [isTyping, setIsTyping] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Initial greeting animation delay when user enters the site (~2.8s)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages([INITIAL_MESSAGE]);
      setIsTyping(false);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll chat thread smoothly whenever messages change or typing state updates
  useEffect(() => {
    if (chatThreadRef.current) {
      chatThreadRef.current.scrollTo({
        top: chatThreadRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isTyping]);

  // Submit name
  const handleNameSubmit = (e) => {
    if (e) e.preventDefault();
    const finalName = inputName.trim();
    const displayName = finalName || '';

    if (finalName) {
      setUserName(finalName);
      setMessages((prev) => [...prev, { id: `user-${Date.now()}`, sender: 'user', text: `Mi nombre es ${finalName}` }]);
    } else {
      setMessages((prev) => [...prev, { id: `user-${Date.now()}`, sender: 'user', text: 'Preferir no decirlo' }]);
    }

    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const greeting = displayName
        ? `¡Un gusto conocerte, ${displayName}! 👋 ¿En qué te puedo ayudar hoy?`
        : '¡Un gusto! 👋 ¿En qué te puedo ayudar hoy?';

      setMessages((prev) => [
        ...prev,
        { id: `bot-${Date.now()}`, sender: 'bot', text: greeting },
      ]);
      setStep('init');
    }, 750);
  };

  const handleUserChoice = (userText, nextStep, operacionVal = '', botResponseText = '') => {
    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [...prev, { id: userMsgId, sender: 'user', text: userText }]);
    setIsTyping(true);

    if (operacionVal) {
      setSelectedOperacion(operacionVal);
      if (onSelectOperacion) onSelectOperacion(operacionVal);
    }

    setTimeout(() => {
      setIsTyping(false);
      if (botResponseText) {
        let text = botResponseText;
        if (userName) {
          text = text.replace(/{name}/g, `, ${userName}`);
        } else {
          text = text.replace(/{name}/g, '');
        }
        const botMsgId = `bot-${Date.now()}`;
        setMessages((prev) => [...prev, { id: botMsgId, sender: 'bot', text }]);
      }
      setStep(nextStep);
    }, 750);
  };

  const handleSelectTipoChoice = (userText, tipoVal) => {
    setSelectedTipo(tipoVal);
    handleUserChoice(
      userText,
      'ubicacion',
      '',
      'Genial{name}! ¿En qué zona andás buscando?'
    );
  };

  const handleSelectUbicacionChoice = (userText, zoneName) => {
    setSelectedUbicacion(zoneName);
    handleUserChoice(
      userText,
      'presupuesto',
      '',
      '¡Una última pregunta más! ¿Con qué presupuesto total contamos? (Teniendo en cuenta expensas y gastos)'
    );
  };

  const handleReset = () => {
    setMessages([]);
    setIsTyping(true);
    setIsRedirecting(false);
    setTimeout(() => {
      setUserName('');
      setInputName('');
      setCustomBudgetInput('');
      setMessages([INITIAL_MESSAGE]);
      setStep('ask_name');
      setSelectedOperacion('');
      setSelectedTipo('');
      setSelectedUbicacion('');
      if (onSelectOperacion) onSelectOperacion('');
      setIsTyping(false);
    }, 2200);
  };

  // Prepares WhatsApp automated opening after 3 seconds!
  const handleInitiateWhatsapp = (userHumanText, messageTemplate) => {
    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [...prev, { id: userMsgId, sender: 'user', text: userHumanText }]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const nameStr = userName ? `, ${userName}` : '';
      const botResponse = `¡Perfecto${nameStr}! Te estoy redirigiendo a WhatsApp para brindarte la atención personalizada que merecés...`;

      setMessages((prev) => [
        ...prev,
        { id: `bot-${Date.now()}`, sender: 'bot', text: botResponse },
      ]);
      setRedirectLabel('Abriendo WhatsApp en unos segundos... 📲');
      setIsRedirecting(true);

      setTimeout(() => {
        let finalMsg = messageTemplate;
        if (userName) {
          finalMsg = `Hola Mónica Cardoso Propiedades, mi nombre es ${userName}. ${messageTemplate.replace(/^Hola Mónica Cardoso Propiedades,?\s*/i, '')}`;
        }
        const encoded = encodeURIComponent(finalMsg);
        window.open(`https://wa.me/5491166092461?text=${encoded}`, '_blank');
        setIsRedirecting(false);
      }, 3000);
    }, 750);
  };

  const handleNavigateCatalog = (
    userHumanText,
    operacion = selectedOperacion,
    tipo = selectedTipo,
    ubicacion = selectedUbicacion,
    maxPrice = '',
    minPrice = '',
    currency = selectedCurrency
  ) => {
    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [...prev, { id: userMsgId, sender: 'user', text: userHumanText }]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const confirmationText = userName
        ? `¡Excelente, ${userName}! Ahí te busco las mejores opciones que se ajustan a tu búsqueda. Dame un segundo...`
        : '¡Excelente! Ahí te busco las mejores opciones que se ajustan a tu búsqueda. Dame un segundo...';

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: confirmationText,
        },
      ]);
      setRedirectLabel('Cargando catálogo personalizado...');
      setIsRedirecting(true);

      setTimeout(() => {
        let url = '/propiedades';
        const params = new URLSearchParams();
        if (operacion) params.set('operacion', operacion);
        if (tipo) params.set('tipo', tipo);
        if (ubicacion) params.set('neighborhood', ubicacion);
        if (currency) params.set('currency', currency);
        if (maxPrice) params.set('maxPrice', maxPrice);
        if (minPrice) params.set('minPrice', minPrice);
        if (params.toString()) url += `?${params.toString()}`;
        router.push(url);
      }, 1400);
    }, 700);
  };

  const handleCustomBudgetSubmit = (e) => {
    if (e) e.preventDefault();
    const val = customBudgetInput.trim();
    if (!val) return;
    const num = Number(val);
    const currSymbol = selectedCurrency === 'ARS' ? '$' : 'USD';
    handleNavigateCatalog(`Presupuesto de ${currSymbol} ${num.toLocaleString('es-AR')} 💵`, selectedOperacion, selectedTipo, selectedUbicacion, num, '', selectedCurrency);
  };

  return (
    <div className={styles.compactAssistant}>
      {/* Assistant Header Bar */}
      <div className={styles.assistantHeader}>
        <div className={styles.profileInfo}>
          <div className={styles.avatarMini}>
            MC
            <span className={styles.onlineDot} />
          </div>
          <span className={styles.assistantTitle}>Mónica Cardoso</span>
        </div>

        {step !== 'ask_name' && (
          <button onClick={handleReset} className={styles.resetBtnCompact} title="Reiniciar conversación">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Reiniciar
          </button>
        )}
      </div>

      {/* Full Scrollable Conversation Thread */}
      <div className={styles.chatThread} ref={chatThreadRef}>
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className={msg.sender === 'user' ? styles.userBubble : styles.botBubble}
            >
              {msg.sender === 'bot' ? (
                <p className={styles.messageText}>
                  <strong className={styles.goldText}>Mónica:</strong> {msg.text}
                </p>
              ) : (
                <p className={styles.userText}>
                  <strong className={styles.userTag}>Tú:</strong> {msg.text}
                </p>
              )}
            </motion.div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              key="typing-indicator"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={styles.botBubble}
            >
              <div className={styles.typingBox}>
                <span className={styles.goldText}>Mónica está escribiendo</span>
                <div className={styles.typingDots}>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Redirecting Progress Loader */}
      {isRedirecting && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.redirectLoader}
        >
          <div className={styles.redirectSpinner} />
          <span>{redirectLabel}</span>
        </motion.div>
      )}

      {/* Input / Action Chips Area */}
      {!isTyping && !isRedirecting && (
        <AnimatePresence mode="wait">
          {step === 'ask_name' && (
            <motion.div
              key="ask-name-input"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className={styles.inputStepContainer}
            >
              <form onSubmit={handleNameSubmit} className={styles.nameInputForm}>
                <input
                  type="text"
                  className={styles.nameInput}
                  placeholder="Escribí tu nombre acá..."
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  autoFocus
                />
                <button type="submit" className={styles.nameSubmitBtn}>
                  Enviar ➔
                </button>
              </form>

              <div className={styles.chipsRow} style={{ marginTop: '6px' }}>
                <button className={styles.chipBtn} onClick={() => handleNameSubmit(null)}>
                  🙋‍♂️ Preferir no decirlo
                </button>
                <button
                  className={styles.chipBtn}
                  onClick={() =>
                    handleInitiateWhatsapp(
                      'Hola Mónica, quisiera tasar mi propiedad 📋',
                      'Hola Mónica Cardoso Propiedades, me gustaría solicitar una tasación para mi propiedad.'
                    )
                  }
                >
                  📋 Tasar mi propiedad
                </button>
                <button
                  className={styles.chipBtn}
                  onClick={() =>
                    handleInitiateWhatsapp(
                      'Hola Mónica, quisiera hacerles una consulta 💬',
                      'Hola Mónica Cardoso Propiedades, quisiera hacer una consulta.'
                    )
                  }
                >
                  💬 Consulta WhatsApp
                </button>
              </div>
            </motion.div>
          )}

          {step === 'init' && (
            <motion.div
              key="init-chips"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className={styles.chipsRow}
            >
              <button
                className={`${styles.chipBtn} ${styles.chipPrimary}`}
                onClick={() =>
                  handleUserChoice(
                    '¡Hola Mónica! Estoy buscando una propiedad 🏡',
                    'operacion',
                    '',
                    '¡Excelente{name}! Para ayudarte mejor, ¿qué tipo de operación estás buscando?'
                  )
                }
              >
                🏡 Buscar propiedad
              </button>

              <button
                className={styles.chipBtn}
                onClick={() =>
                  handleInitiateWhatsapp(
                    '¡Hola Mónica! Quisiera tasar mi propiedad 📋',
                    'Hola Mónica Cardoso Propiedades, me gustaría solicitar una tasación para mi propiedad.'
                  )
                }
              >
                📋 Tasar mi propiedad
              </button>

              <button
                className={styles.chipBtn}
                onClick={() =>
                  handleInitiateWhatsapp(
                    '¡Hola Mónica! Quisiera hacer una consulta 💬',
                    'Hola Mónica Cardoso Propiedades, quisiera hacer una consulta.'
                  )
                }
              >
                💬 Consulta WhatsApp
              </button>

              <button
                className={styles.chipBtn}
                onClick={() => {
                  handleUserChoice(
                    '¡Hola Mónica! Quisiera conocer los emprendimientos ⭐',
                    'init',
                    '',
                    '¡Excelente elección{name}! Te llevo a ver los desarrollos y emprendimientos en pozo 🏢'
                  );
                  setTimeout(() => router.push('/emprendimientos'), 1200);
                }}
              >
                ⭐ Emprendimientos
              </button>
            </motion.div>
          )}

          {step === 'operacion' && (
            <motion.div
              key="operacion-chips"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className={styles.chipsRow}
            >
              <button
                className={`${styles.chipBtn} ${styles.chipPrimary}`}
                onClick={() =>
                  handleUserChoice(
                    'Quiero comprar 🔑',
                    'tipo',
                    'venta',
                    'Perfecto{name}. ¿Qué tipo de inmueble tenés en mente?'
                  )
                }
              >
                🔑 Comprar
              </button>

              <button
                className={`${styles.chipBtn} ${styles.chipPrimary}`}
                onClick={() =>
                  handleUserChoice(
                    'Busco alquilar 🏠',
                    'tipo',
                    'alquiler',
                    'Perfecto{name}. ¿Qué tipo de inmueble tenés en mente?'
                  )
                }
              >
                🏠 Alquilar
              </button>

              <button
                className={styles.chipBtn}
                onClick={() => handleNavigateCatalog('Busco un alquiler temporario ☀️', 'temporario')}
              >
                ☀️ Temporario
              </button>

              <button
                className={styles.chipBtn}
                onClick={() => handleNavigateCatalog('Quisiera ver todas las opciones disponibles 🔄', '')}
              >
                🔄 Ver todo
              </button>
            </motion.div>
          )}

          {step === 'tipo' && (
            <motion.div
              key="tipo-chips"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className={styles.chipsRow}
            >
              <button
                className={`${styles.chipBtn} ${styles.chipPrimary}`}
                onClick={() => handleSelectTipoChoice('Un departamento 🏢', 'departamento')}
              >
                🏢 Departamento
              </button>

              <button
                className={`${styles.chipBtn} ${styles.chipPrimary}`}
                onClick={() => handleSelectTipoChoice('Una casa o PH 🏡', 'casa')}
              >
                🏡 Casa / PH
              </button>

              <button
                className={styles.chipBtn}
                onClick={() => handleSelectTipoChoice('Un terreno 🏞️', 'terreno')}
              >
                🏞️ Terreno
              </button>

              <button
                className={styles.chipBtn}
                onClick={() => handleSelectTipoChoice('Un local u oficina 💼', 'local')}
              >
                💼 Local / Oficina
              </button>

              <button
                className={styles.chipBtn}
                onClick={() => handleNavigateCatalog(`Ver todas las opciones en ${selectedOperacion} ✨`, selectedOperacion, '')}
              >
                ✨ Ver todas en {selectedOperacion}
              </button>
            </motion.div>
          )}

          {step === 'ubicacion' && (
            <motion.div
              key="ubicacion-chips"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className={styles.chipsRow}
            >
              {FEATURED_ZONES.map((zone) => (
                <button
                  key={zone}
                  className={`${styles.chipBtn} ${styles.chipPrimary}`}
                  onClick={() => handleSelectUbicacionChoice(`En ${zone} 📍`, zone)}
                >
                  📍 {zone}
                </button>
              ))}

              <button
                className={styles.chipBtn}
                onClick={() => handleSelectUbicacionChoice('En cualquier zona 🌐', '')}
              >
                🌐 En cualquier zona
              </button>

              {/* Dynamic Dropdown selector chip for ALL locations */}
              <div className={styles.chipSelectWrapper}>
                <select
                  className={styles.locationSelectChip}
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      const zoneName = e.target.value;
                      handleSelectUbicacionChoice(`En ${zoneName} 📍`, zoneName);
                    }
                  }}
                >
                  <option value="" disabled hidden>
                    🔎 Buscar otra zona...
                  </option>
                  {ALL_ZONES.map((zone) => (
                    <option key={zone} value={zone}>
                      📍 {zone}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}

          {step === 'presupuesto' && (
            <motion.div
              key="presupuesto-chips"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className={styles.inputStepContainer}
            >
              {/* Currency Selector Row */}
              <div className={styles.chipsRow} style={{ marginBottom: '2px' }}>
                <span style={{ fontSize: '12px', color: 'var(--gray-300)', fontWeight: 600 }}>Seleccionar Moneda:</span>
                <button
                  type="button"
                  className={`${styles.chipBtn} ${selectedCurrency === 'USD' ? styles.chipPrimary : ''}`}
                  onClick={() => setSelectedCurrency('USD')}
                >
                  💵 USD (Dólares)
                </button>
                <button
                  type="button"
                  className={`${styles.chipBtn} ${selectedCurrency === 'ARS' ? styles.chipPrimary : ''}`}
                  onClick={() => setSelectedCurrency('ARS')}
                >
                  🇦🇷 $ (Pesos ARS)
                </button>
              </div>

              {/* Dynamic Budget Range Chips */}
              <div className={styles.chipsRow}>
                {selectedCurrency === 'USD' ? (
                  <>
                    <button
                      className={`${styles.chipBtn} ${styles.chipPrimary}`}
                      onClick={() => handleNavigateCatalog('Hasta USD 100.000 💵', selectedOperacion, selectedTipo, selectedUbicacion, 100000, 0, 'USD')}
                    >
                      💵 Hasta USD 100.000
                    </button>

                    <button
                      className={`${styles.chipBtn} ${styles.chipPrimary}`}
                      onClick={() => handleNavigateCatalog('USD 100.000 a 250.000 💵', selectedOperacion, selectedTipo, selectedUbicacion, 250000, 100000, 'USD')}
                    >
                      💵 USD 100.000 - 250.000
                    </button>

                    <button
                      className={styles.chipBtn}
                      onClick={() => handleNavigateCatalog('USD 250.000 a 500.000 💵', selectedOperacion, selectedTipo, selectedUbicacion, 500000, 250000, 'USD')}
                    >
                      💵 USD 250.000 - 500.000
                    </button>

                    <button
                      className={styles.chipBtn}
                      onClick={() => handleNavigateCatalog('Más de USD 500.000 💎', selectedOperacion, selectedTipo, selectedUbicacion, '', 500000, 'USD')}
                    >
                      💎 Más de USD 500.000
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={`${styles.chipBtn} ${styles.chipPrimary}`}
                      onClick={() => handleNavigateCatalog('Hasta $ 50.000.000 💵', selectedOperacion, selectedTipo, selectedUbicacion, 50000000, 0, 'ARS')}
                    >
                      💵 Hasta $ 50.000.000
                    </button>

                    <button
                      className={`${styles.chipBtn} ${styles.chipPrimary}`}
                      onClick={() => handleNavigateCatalog('$ 50M a $ 150M 💵', selectedOperacion, selectedTipo, selectedUbicacion, 150000000, 50000000, 'ARS')}
                    >
                      💵 $ 50M - 150M
                    </button>

                    <button
                      className={styles.chipBtn}
                      onClick={() => handleNavigateCatalog('$ 150M a $ 300M 💵', selectedOperacion, selectedTipo, selectedUbicacion, 300000000, 150000000, 'ARS')}
                    >
                      💵 $ 150M - 300M
                    </button>

                    <button
                      className={styles.chipBtn}
                      onClick={() => handleNavigateCatalog('Más de $ 300.000.000 💎', selectedOperacion, selectedTipo, selectedUbicacion, '', 300000000, 'ARS')}
                    >
                      💎 Más de $ 300.000.000
                    </button>
                  </>
                )}

                <button
                  className={styles.chipBtn}
                  onClick={() => handleNavigateCatalog('Sin límite de presupuesto ✨', selectedOperacion, selectedTipo, selectedUbicacion, '', '', selectedCurrency)}
                >
                  ✨ Sin límite de presupuesto
                </button>
              </div>

              {/* Custom budget input form */}
              <form onSubmit={handleCustomBudgetSubmit} className={styles.nameInputForm} style={{ marginTop: '4px' }}>
                <input
                  type="number"
                  className={styles.nameInput}
                  placeholder={selectedCurrency === 'ARS' ? "O ingresá tu presupuesto máximo en $ (ARS)..." : "O ingresá tu presupuesto máximo en USD..."}
                  value={customBudgetInput}
                  onChange={(e) => setCustomBudgetInput(e.target.value)}
                />
                <button type="submit" className={styles.nameSubmitBtn}>
                  Buscar ➔
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
