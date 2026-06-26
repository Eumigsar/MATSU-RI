import { useState, useEffect } from 'react'
import { X, Zap, Shield } from 'lucide-react'
import { useGameStore } from '../stores/gameStore'
import { TONE_COLORS } from '../types'
import type { HanziData } from '../types'

const MVP_HANZI: HanziData[] = [
  { hanzi: '一', pinyin: 'yī',  pinyin_base: 'yi',  tone: 1, meaning_pt: 'um',     etymology: 'Um único traço horizontal — simples como o início de toda jornada no Caminho.', hsk_level: 1, stroke_count: 1 },
  { hanzi: '二', pinyin: 'èr',  pinyin_base: 'er',  tone: 2, meaning_pt: 'dois',   etymology: 'Dois traços paralelos: o Céu acima, a Terra abaixo — os dois pilares do cosmos.', hsk_level: 1, stroke_count: 2 },
  { hanzi: '三', pinyin: 'sān', pinyin_base: 'san', tone: 1, meaning_pt: 'três',   etymology: 'Três traços: Céu, Humanidade e Terra — a sagrada tríade do Tao.', hsk_level: 1, stroke_count: 3 },
  { hanzi: '四', pinyin: 'sì',  pinyin_base: 'si',  tone: 4, meaning_pt: 'quatro', etymology: 'Uma boca dentro de um quadrado: os quatro cantos do mundo mundano.', hsk_level: 1, stroke_count: 5 },
  { hanzi: '五', pinyin: 'wǔ',  pinyin_base: 'wu',  tone: 3, meaning_pt: 'cinco',  etymology: 'Os Cinco Elementos — Madeira, Fogo, Terra, Metal e Água — em equilíbrio.', hsk_level: 1, stroke_count: 4 },
]

function buildChoices(correct: HanziData): HanziData[] {
  const others = MVP_HANZI.filter((h) => h.hanzi !== correct.hanzi)
  const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3)
  const all = [...shuffled, correct].sort(() => Math.random() - 0.5)
  return all
}

interface Props {
  hanzi: HanziData
}

export function LearningModal({ hanzi }: Props) {
  const { submitAnswer, feedbackState, closeLearning } = useGameStore()
  const [choices, setChoices] = useState<HanziData[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const toneColor = TONE_COLORS[hanzi.tone]

  useEffect(() => {
    setChoices(buildChoices(hanzi))
    setSelected(null)
  }, [hanzi])

  const handleChoice = (choice: HanziData) => {
    if (selected !== null || feedbackState !== 'idle') return
    setSelected(choice.pinyin_base)
    submitAnswer(hanzi, choice.hanzi === hanzi.hanzi)
  }

  const isAnswered = selected !== null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-matsuri-ink/70 backdrop-blur-sm"
        onClick={isAnswered ? undefined : closeLearning}
      />

      {/* Flash feedback */}
      {feedbackState === 'wrong' && (
        <div className="absolute inset-0 bg-matsuri-imperial/20 pointer-events-none animate-flash-red" />
      )}

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-matsuri-paper border-2 border-matsuri-stone rounded-lg shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 bg-matsuri-ink text-matsuri-paper">
            <span className="font-display text-xs tracking-widest uppercase opacity-70">
              Treino de Reconhecimento
            </span>
            <button onClick={closeLearning} className="opacity-50 hover:opacity-100 transition-opacity">
              <X size={16} />
            </button>
          </div>

          {/* Hanzi display */}
          <div className="text-center py-8 px-6">
            <div
              className="font-hanzi text-9xl leading-none mb-2 select-none"
              style={{ color: toneColor.hex }}
            >
              {hanzi.hanzi}
            </div>
            <div className="text-matsuri-stone text-sm font-body italic mt-1">
              {hanzi.meaning_pt}
            </div>
          </div>

          {/* Question */}
          <div className="px-6 pb-2">
            <p className="text-center text-matsuri-ink font-body text-sm mb-4">
              Qual é o <strong>Pinyin</strong> deste símbolo?
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {choices.map((c) => {
                const isCorrect = c.hanzi === hanzi.hanzi
                const isThis = selected === c.pinyin_base
                let btnClass =
                  'w-full py-3 px-4 rounded border-2 font-hanzi text-xl transition-all duration-200 '

                if (!isAnswered) {
                  btnClass += 'border-matsuri-stone/40 bg-white hover:border-matsuri-imperial hover:bg-matsuri-imperial/5 cursor-pointer'
                } else if (isCorrect) {
                  btnClass += 'border-matsuri-jade bg-matsuri-jade/10 text-matsuri-jade'
                } else if (isThis) {
                  btnClass += 'border-matsuri-imperial bg-matsuri-imperial/10 text-matsuri-imperial'
                } else {
                  btnClass += 'border-matsuri-stone/20 bg-white/50 opacity-40'
                }

                return (
                  <button key={c.hanzi} className={btnClass} onClick={() => handleChoice(c)}>
                    <div className="text-lg" style={{ color: TONE_COLORS[c.tone].hex }}>
                      {c.pinyin}
                    </div>
                    <div className="text-xs text-matsuri-stone/70 mt-0.5">{c.meaning_pt}</div>
                  </button>
                )
              })}
            </div>

            {/* Feedback */}
            {feedbackState === 'correct' && (
              <div className="flex items-center gap-2 justify-center text-matsuri-jade font-body text-sm mb-4 animate-gold-burst">
                <Zap size={16} />
                <span>Excelente! +XP de Qi cultivado!</span>
              </div>
            )}
            {feedbackState === 'wrong' && (
              <div className="flex items-center gap-2 justify-center text-matsuri-imperial font-body text-sm mb-4">
                <Shield size={16} />
                <span>O espírito resiste. Tente novamente.</span>
              </div>
            )}
          </div>

          {/* Etymology footer */}
          <div className="px-6 pb-5">
            <div className="bg-matsuri-ink/5 border border-matsuri-stone/20 rounded p-3">
              <p className="text-xs text-matsuri-ink/60 font-body italic leading-relaxed">
                <span className="not-italic font-semibold text-matsuri-stone">Etimologia: </span>
                {hanzi.etymology}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
