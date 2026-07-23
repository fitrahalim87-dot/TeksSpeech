export interface Voice {
  id: string;
  name: string;
  gender: 'Laki-laki' | 'Perempuan';
  description: string;
}

export const GEMINI_VOICES: Voice[] = [
  // Laki-laki
  { id: 'Achird', name: 'Achird', gender: 'Laki-laki', description: 'Suara pria yang lembut dan jernih' },
  { id: 'Charon', name: 'Charon', gender: 'Laki-laki', description: 'Suara pria yang dalam dan berwibawa' },
  { id: 'Enceladus', name: 'Enceladus', gender: 'Laki-laki', description: 'Suara pria yang kuat dan berenergi' },
  { id: 'Fenrir', name: 'Fenrir', gender: 'Laki-laki', description: 'Suara pria yang tegas dan kuat' },
  { id: 'Iapetus', name: 'Iapetus', gender: 'Laki-laki', description: 'Suara pria yang dewasa dan bijak' },
  { id: 'Orus', name: 'Orus', gender: 'Laki-laki', description: 'Suara pria yang ramah dan bersahabat' },
  { id: 'Puck', name: 'Puck', gender: 'Laki-laki', description: 'Suara pria yang ceria dan lincah' },
  { id: 'Rasalgethi', name: 'Rasalgethi', gender: 'Laki-laki', description: 'Suara pria yang berat dan mantap' },
  { id: 'Sadaltager', name: 'Sadaltager', gender: 'Laki-laki', description: 'Suara pria yang santai dan natural' },
  { id: 'Umbriel', name: 'Umbriel', gender: 'Laki-laki', description: 'Suara pria yang misterius dan dalam' },
  { id: 'Algenib', name: 'Algenib', gender: 'Laki-laki', description: 'Suara pria yang cerah dan ekspresif' },
  { id: 'Pulcherrima', name: 'Pulcherrima', gender: 'Laki-laki', description: 'Suara pria yang sangat indah dan jernih' },
  { id: 'Sadachbia', name: 'Sadachbia', gender: 'Laki-laki', description: 'Suara pria yang ceria dan optimis' },
  { id: 'Schedar', name: 'Schedar', gender: 'Laki-laki', description: 'Suara pria yang kuat dan berwibawa' },
  { id: 'Zubenelgenubi', name: 'Zubenelgenubi', gender: 'Laki-laki', description: 'Suara pria yang unik dan berkarakter' },

  // Perempuan
  { id: 'Achernar', name: 'Achernar', gender: 'Perempuan', description: 'Suara wanita yang tenang dan stabil' },
  { id: 'Algieba', name: 'Algieba', gender: 'Perempuan', description: 'Suara wanita yang anggun dan berkelas' },
  { id: 'Alnilam', name: 'Alnilam', gender: 'Perempuan', description: 'Suara wanita yang tenang dan damai' },
  { id: 'Aoede', name: 'Aoede', gender: 'Perempuan', description: 'Suara wanita yang merdu dan puitis' },
  { id: 'Autonoe', name: 'Autonoe', gender: 'Perempuan', description: 'Suara wanita yang tegas dan mandiri' },
  { id: 'Callirrhoe', name: 'Callirrhoe', gender: 'Perempuan', description: 'Suara wanita yang manis dan ramah' },
  { id: 'Despina', name: 'Despina', gender: 'Perempuan', description: 'Suara wanita yang lincah dan enerjik' },
  { id: 'Erinome', name: 'Erinome', gender: 'Perempuan', description: 'Suara wanita yang hangat dan mengayomi' },
  { id: 'Gacrux', name: 'Gacrux', gender: 'Perempuan', description: 'Suara wanita yang dewasa dan bijaksana' },
  { id: 'Kore', name: 'Kore', gender: 'Perempuan', description: 'Suara wanita yang polos dan tulus' },
  { id: 'Laomedeia', name: 'Laomedeia', gender: 'Perempuan', description: 'Suara wanita yang misterius dan menarik' },
  { id: 'Leda', name: 'Leda', gender: 'Perempuan', description: 'Suara wanita yang tenang dan stabil' },
  { id: 'Sulafat', name: 'Sulafat', gender: 'Perempuan', description: 'Suara wanita yang lembut dan menenangkan' },
  { id: 'Vindemiatrix', name: 'Vindemiatrix', gender: 'Perempuan', description: 'Suara wanita yang cerdas dan artikulatif' },
  { id: 'Zephyr', name: 'Zephyr', gender: 'Perempuan', description: 'Suara wanita yang lembut dan mengalir' },
];

export const STYLE_PRESETS = [
  { name: 'Ceria', instruction: 'Say cheerfully: ' },
  { name: 'Serius', instruction: 'Say seriously: ' },
  { name: 'Marah', instruction: 'Say angrily: ' },
  { name: 'Berbisik', instruction: 'Say in a whisper: ' },
  { name: 'Semangat', instruction: 'Say excitedly: ' },
];
