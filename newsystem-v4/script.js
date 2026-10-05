/* =========================================================
   New System — v4: κατηγορίες = τύποι καταστημάτων
   (φωτογραφίες από τη σελίδα «Ανακαινίσεις»), προϊόντα μέσα σε κάθε κατάστημα
   ========================================================= */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (n) => n.toLocaleString('el-GR', { style: 'currency', currency: 'EUR' });
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const icon = (id) => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;
  const pad = (n) => String(n).padStart(2, '0');
  const img = (s, cls = '', lazy = true) => `<img class="${cls}" src="${s.img}" alt="${esc(s.alt)}" width="702" height="526"${lazy ? ' loading="lazy"' : ''} decoding="async">`;

  /* =========================================================
     ΔΕΔΟΜΕΝΑ
     ========================================================= */

  /* Ομάδες καταστημάτων (για τη μπάρα και το mega menu) */
  const GROUPS = [
    { id: 'endysi', name: 'Ένδυση & υπόδηση', short: 'Ένδυση', icon: 'i-hanger', c: '#ff6b4a' },
    { id: 'ygeia', name: 'Φαρμακεία & ομορφιά', short: 'Υγεία & ομορφιά', icon: 'i-cross', c: '#2ec4a6' },
    { id: 'trofima', name: 'Σούπερ μάρκετ & τρόφιμα', short: 'Τρόφιμα', icon: 'i-basket', c: '#ffd23f' },
    { id: 'eidika', name: 'Εξειδικευμένα & εκθέσεις', short: 'Εξειδικευμένα', icon: 'i-gem', c: '#a78bfa' }
  ];
  const GROUP = Object.fromEntries(GROUPS.map((g) => [g.id, g]));

  /* Τύποι καταστημάτων — όπως εμφανίζονται στη σελίδα «Ανακαινίσεις» του newsystem.gr */
  const SHOPS = [
    { id: 'polykatastima', group: 'endysi', name: 'Πολυκατάστημα ενδυμάτων – υποδημάτων', short: 'Πολυκατάστημα', title: 'Πολυκατάστημα<br>ένδυσης', c: '#ffd23f',
      text: 'Μεγάλοι χώροι με πολλά τμήματα: ραφιέρες τοίχου, καλόγεροι, κούκλες και πάγκος ταμείου που κρατούν καθαρή τη διαδρομή του πελάτη από τμήμα σε τμήμα.',
      needs: ['Κούκλες', 'Καλόγεροι', 'Ραφιέρες τοίχου', 'Πάγκος ταμείου', 'Αντικλεπτικά'],
      alt: 'Εσωτερικό πολυκαταστήματος ενδυμάτων με ξύλινες ραφιέρες, πάγκο ταμείου, καθιστή κούκλα βιτρίνας και πατάρι' },
    { id: 'gynaikeia', group: 'endysi', name: 'Γυναικεία ενδύματα', short: 'Γυναικεία', title: 'Γυναικεία<br>ενδύματα', c: '#ff8fc7',
      text: 'Βιτρίνα που σταματά τον περαστικό και εσωτερικό που αναδεικνύει κάθε κομμάτι: κούκλες, κρεμάστρες, καλόγεροι και καθρέπτες.',
      needs: ['Γυναικείες κούκλες', 'Κρεμάστρες', 'Καλόγεροι', 'Καθρέπτες', 'Αντικλεπτικά'],
      alt: 'Πρόσοψη καταστήματος γυναικείων ενδυμάτων με μεγάλη γυάλινη βιτρίνα, κούκλες και κόκκινη φωτεινή επιγραφή' },
    { id: 'andrika', group: 'endysi', name: 'Ανδρικά ενδύματα', short: 'Ανδρικά', title: 'Ανδρικά<br>ενδύματα', c: '#4f7cff', dark: true,
      text: 'Ζεστά υλικά, κρυφός φωτισμός και κομψές μπάρες κρέμασης για κοστούμια, πουκάμισα και αξεσουάρ.',
      needs: ['Ανδρικά μπούστα', 'Ξύλινες κρεμάστρες', 'Modular ράφια', 'Καθρέπτες'],
      alt: 'Εσωτερικό καταστήματος ανδρικών ενδυμάτων με σκούρα ξύλινη κολόνα, φωτισμένες κόγχες με ράφια και ανδρικά μπούστα' },
    { id: 'paidika', group: 'endysi', name: 'Παιδικά ενδύματα', short: 'Παιδικά', title: 'Παιδικά<br>ενδύματα', c: '#5bd0f5',
      text: 'Ανθεκτικός εξοπλισμός στο ύψος των παιδιών, με παιδικές κούκλες και πολύχρωμη προβολή στον τοίχο.',
      needs: ['Παιδικές κούκλες', 'Παιδικές κρεμάστρες', 'Μπάρες τοίχου', 'Καλόγεροι'],
      alt: 'Κατάστημα παιδικών ενδυμάτων με σειρά από παιδικές κούκλες και ρούχα κρεμασμένα σε μπάρες τοίχου' },
    { id: 'athlitika', group: 'endysi', name: 'Αθλητικά ενδύματα', short: 'Αθλητικά', title: 'Αθλητικά<br>ενδύματα', c: '#2ec4a6',
      text: 'Πολλά κομμάτια σε λίγο χώρο: διπλές μπάρες, πάνελ slatwall και κούκλες σε κίνηση για ρούχα και εξοπλισμό.',
      needs: ['Αθλητικές κούκλες', 'Slatwall', 'Gridwall', 'Πλαστικές κρεμάστρες'],
      alt: 'Κατάστημα αθλητικών ενδυμάτων με διπλές μπάρες κρέμασης γεμάτες ρούχα και ράφια με καπέλα' },
    { id: 'esoroucha', group: 'endysi', name: 'Εσώρουχα', short: 'Εσώρουχα', title: 'Εσώρουχα', c: '#ff6b4a',
      text: 'Ευέλικτος τοίχος slatwall, νησίδες και μπούστα που δείχνουν σωστά τα εσώρουχα και τα μαγιό.',
      needs: ['Μπούστα εσωρούχων', 'Κρεμάστρες με κλιπ', 'Slatwall', 'Γάντζοι'],
      alt: 'Κατάστημα εσωρούχων με λευκό τοίχο slatwall, νησίδα με μαγιό και κούκλα με λευκό φόρεμα' },
    { id: 'gounarika', group: 'endysi', name: 'Γουναρικά & δερμάτινα', short: 'Γουναρικά', title: 'Γουναρικά<br>&amp; δερμάτινα', c: '#ffa23a',
      text: 'Τα βαριά ρούχα θέλουν γερές μπάρες, ενισχυμένες κρεμάστρες και άπλετο φως για να φανεί η υφή.',
      needs: ['Ενισχυμένες κρεμάστρες', 'Κούκλες', 'Καλόγεροι', 'Καθρέπτες'],
      alt: 'Κατάστημα γουναρικών και δερμάτινων με φωτισμένη οροφή, κυκλικό πάγκο και κρεμασμένα παλτά' },
    { id: 'ypodimata', group: 'endysi', name: 'Υποδήματα', short: 'Υποδήματα', title: 'Υποδήματα', c: '#a78bfa',
      text: 'Ράφια από κρύσταλλο, φωτισμένοι τοίχοι και χαμηλοί καθρέπτες για να δοκιμάζει ο πελάτης με άνεση.',
      needs: ['Κρύσταλλα ραφιών', 'Σταντ παπουτσιών', 'Καθρέπτες δαπέδου', 'Βάθρα'],
      alt: 'Φωτισμένος τοίχος καταστήματος υποδημάτων με γυάλινα ράφια γεμάτα πέδιλα και παπούτσια' },
    { id: 'aksesouar', group: 'endysi', name: 'Αξεσουάρ', short: 'Αξεσουάρ', title: 'Αξεσουάρ', c: '#ffd23f',
      text: 'Μικρά αντικείμενα σε πολλά χρώματα: περιστρεφόμενα σταντ, slatwall με γάντζους και κούκλες για τσάντες και καπέλα.',
      needs: ['Περιστρεφόμενα σταντ', 'Γάντζοι slatwall', 'Κεφάλια βιτρίνας', 'Βάσεις κοσμημάτων'],
      alt: 'Είσοδος καταστήματος τσαντών και αξεσουάρ με φωτεινή επιγραφή, κούκλες και γεμάτα ράφια' },
    { id: 'farmakeia', group: 'ygeia', name: 'Φαρμακεία', short: 'Φαρμακεία', title: 'Φαρμακεία', c: '#2ec4a6',
      text: 'Ραφιέρες φαρμακείου με φωτισμό, γόνδολες, διαχωριστικά και θήκες τιμών, οργανωμένα για γρήγορη εξυπηρέτηση.',
      needs: ['Ραφιέρες με LED', 'Γόνδολες', 'Θήκες τιμών', 'Διαχωριστικά', 'Πάγκος'],
      alt: 'Γωνία φαρμακείου με σκούρες ραφιέρες τοίχου γεμάτες προϊόντα και φωτισμένες ταμπέλες' },
    { id: 'kallyntika', group: 'ygeia', name: 'Καλλυντικά', short: 'Καλλυντικά', title: 'Καλλυντικά', c: '#ff8fc7',
      text: 'Σκούρα φόντα, φωτισμένα ράφια και νησίδες που κάνουν τις συσκευασίες να ξεχωρίζουν.',
      needs: ['Νησίδες', 'Κρύσταλλα ραφιών', 'Καθρέπτες πάγκου', 'Διαχωριστικά'],
      alt: 'Κατάστημα καλλυντικών με μαύρη νησίδα προβολής, φωτισμένα ράφια και μαύρα μπαλόνια' },
    { id: 'supermarket', group: 'trofima', name: 'Super market & ψιλικά', short: 'Super market', title: 'Super market<br>&amp; ψιλικά', c: '#ffd23f',
      text: 'Γόνδολες, ραφιέρες τοίχου, ράγες τιμών και καλάθια: ό,τι χρειάζεται από το mini market ως το σούπερ μάρκετ.',
      needs: ['Γόνδολες', 'Ραφιέρες τοίχου', 'Θήκες τιμών', 'Καλάθια', 'Αντικλεπτικές πύλες'],
      alt: 'Mini market με μεταλλικές ραφιέρες τοίχου και γόνδολα, κόκκινους τοίχους και ασπρόμαυρο δάπεδο' },
    { id: 'viologika', group: 'trofima', name: 'Βιολογικά προϊόντα', short: 'Βιολογικά', title: 'Βιολογικά<br>προϊόντα', c: '#b8e04a',
      text: 'Φυσικό ξύλο, ραφιέρες τύπου κασέτας και καθαρή σήμανση τιμών για προϊόντα που θέλουν να δείχνουν φυσικά.',
      needs: ['Ξύλινες ραφιέρες', 'Γόνδολες', 'Θήκες τιμών', 'Καλάθια'],
      alt: 'Κατάστημα βιολογικών προϊόντων με κλιμακωτές ξύλινες κασέτες προβολής πίσω από τη βιτρίνα' },
    { id: 'chrysochoia', group: 'eidika', name: 'Χρυσοχοΐα', short: 'Χρυσοχοΐα', title: 'Χρυσοχοΐα', c: '#12131a', dark: true,
      text: 'Φωτισμένες βιτρίνες, κρύσταλλα και βάσεις κοσμημάτων, με την ασφάλεια και τη λάμψη που θέλει ένα χρυσοχοείο.',
      needs: ['Βιτρίνες με LED', 'Βάσεις κοσμημάτων', 'Κρύσταλλα', 'Πάγκος'],
      alt: 'Χρυσοχοείο υπό κατασκευή με μαύρες κάθετες βιτρίνες τοίχου και μπλε φωτισμό LED' },
    { id: 'kiniti', group: 'eidika', name: 'Κινητή τηλεφωνία', short: 'Κινητή', title: 'Κινητή<br>τηλεφωνία', c: '#5bd0f5',
      text: 'Τοίχοι slatwall με γάντζους, βάσεις συσκευών από plexiglass και πάγκος εξυπηρέτησης για καταστήματα κινητής.',
      needs: ['Slatwall', 'Βάσεις plexiglass', 'Σταντ αξεσουάρ', 'Πάγκος'],
      alt: 'Κατάστημα κινητής τηλεφωνίας με ξύλινες νησίδες slatwall και ψηλό διαφημιστικό σταντ' },
    { id: 'mousika', group: 'eidika', name: 'Μουσικά όργανα', short: 'Μουσικά όργανα', title: 'Μουσικά<br>όργανα', c: '#ffa23a',
      text: 'Πάγκοι-βιτρίνες, slatwall και βάσεις για κιθάρες, ώστε τα όργανα να κρέμονται με ασφάλεια και να φαίνονται.',
      needs: ['Πάγκος βιτρίνα', 'Slatwall', 'Βάσεις κιθάρας', 'Γάντζοι'],
      alt: 'Κατάστημα μουσικών οργάνων με ξύλινους πάγκους-βιτρίνες και κιθάρες κρεμασμένες σε τοίχο slatwall' },
    { id: 'vivliopoleia', group: 'eidika', name: 'Βιβλιοπωλεία', short: 'Βιβλιοπωλεία', title: 'Βιβλιο&shy;πωλεία', c: '#ff6b4a',
      text: 'Σταντ βιβλίων, ραφιέρες και πάγκοι για βιβλία, χαρτικά και παιχνίδια.',
      needs: ['Σταντ βιβλίων', 'Ραφιέρες', 'Σταντ εντύπων', 'Περιστρεφόμενα σταντ'],
      alt: 'Βιτρίνα βιβλιοπωλείου με ξύλινο σταντ σε σχήμα πυραμίδας με βιβλία και παιχνίδια' },
    { id: 'petshop', group: 'eidika', name: 'Pet shop', short: 'Pet shop', title: 'Pet shop', c: '#b8e04a',
      text: 'Ραφιέρες βαρέως τύπου για ζωοτροφές, slatwall για αξεσουάρ και ειδικές κατασκευές όπως ενυδρεία.',
      needs: ['Ραφιέρες βαρέως τύπου', 'Γόνδολες', 'Slatwall', 'Καλάθια'],
      alt: 'Pet shop με συνθετικό γκαζόν, ραφιέρες με αξεσουάρ για κατοικίδια και γυάλινη δεξαμενή με νερό' },
    { id: 'stand', group: 'eidika', name: 'Stand εκθέσεων', short: 'Stand εκθέσεων', title: 'Stand<br>εκθέσεων', c: '#4f7cff', dark: true,
      text: 'Περίπτερα για εκθέσεις: βάθρα, gridwall, σταντ εντύπων και κατασκευές που στήνονται και ξεστήνονται γρήγορα.',
      needs: ['Βάθρα', 'Gridwall', 'Σταντ εντύπων', 'Ειδική κατασκευή'],
      alt: 'Λευκό εκθεσιακό περίπτερο με κλιμακωτά βάθρα, κολόνες και προβολείς' }
  ];
  SHOPS.forEach((s) => {
    s.img = `img/${s.id}.webp`;
    // μήκος της μεγαλύτερης λέξης του τίτλου: ο τίτλος μεγαλώνει όσο χωράει χωρίς να σπάει λέξη
    s.len = Math.max(...s.title.replace(/&shy;/g, '').replace(/<br>|&amp;/g, ' ').split(/\s+/).map((w) => w.length));
  });
  const SHOP = Object.fromEntries(SHOPS.map((s) => [s.id, s]));

  /* Τύποι προϊόντων (δεύτερο επίπεδο: φίλτρα μέσα στο κατάστημα και στην αναζήτηση) */
  const TYPES = [
    { id: 'koukles', short: 'Κούκλες', name: 'Κούκλες βιτρίνας', icon: 'i-mannequin', c: '#ffd23f', subs: ['Γυναικείες', 'Ανδρικές', 'Παιδικές', 'Μπούστα', 'Περούκες'] },
    { id: 'kremastres', short: 'Κρεμάστρες', name: 'Κρεμάστρες', icon: 'i-hanger', c: '#ff6b4a', subs: ['Ξύλινες', 'Πλαστικές', 'Αντικλεπτικές', 'Παιδικές'] },
    { id: 'rafieres', short: 'Ραφιέρες', name: 'Ραφιέρες & Modular', icon: 'i-shelf', c: '#4f7cff', dark: true, subs: ['Modular', 'Chrome Grid', 'Ορθοστάτες', 'Κρύσταλλα'] },
    { id: 'slatwall', short: 'Slatwall', name: 'Slatwall & Γόνδολες', icon: 'i-slat', c: '#2ec4a6', subs: ['Πάνελ slatwall', 'Γόνδολες', 'Γάντζοι'] },
    { id: 'stand', short: 'Σταντ', name: 'Σταντ & Gridwall', icon: 'i-rail', c: '#a78bfa', subs: ['Καλόγεροι ρούχων', 'Σταντ προβολής', 'Πάνελ gridwall', 'Βάθρα'] },
    { id: 'kathreptes', short: 'Καθρέπτες', name: 'Καθρέπτες', icon: 'i-mirror', c: '#ff8fc7', subs: ['Επιδαπέδιοι', 'Επιτοίχιοι', 'Πάγκου'] },
    { id: 'plexi', short: 'Plexiglass', name: 'Plexiglass', icon: 'i-plexi', c: '#5bd0f5', subs: ['Θήκες τιμών', 'Σταντ εντύπων', 'Βάσεις προβολής'] },
    { id: 'aksesouar', short: 'Αξεσουάρ', name: 'Αξεσουάρ & Ασφάλεια', icon: 'i-shield', c: '#ffa23a', subs: ['Αντικλεπτικά', 'Καλάθια', 'Ράγες τιμών'] },
    { id: 'kataskeves', short: 'Κατασκευές', name: 'Ειδικές κατασκευές', icon: 'i-cube', c: '#12131a', dark: true, subs: ['Πάγκοι', 'Βιτρίνες', 'Stand'] }
  ];
  const TYPE = Object.fromEntries(TYPES.map((t) => [t.id, t]));

  /* Ενδεικτικά προϊόντα — κάθε προϊόν ανήκει σε έναν τύπο και σε ένα ή περισσότερα καταστήματα */
  const CLOTHES = ['polykatastima', 'gynaikeia', 'andrika', 'paidika', 'athlitika', 'esoroucha', 'gounarika'];
  const PRODUCTS = [
    { id: 'p1', cat: 'koukles', name: 'Κούκλα γυναικεία πολυεστερική, λευκή γυαλιστερή', pack: 'με βάση γυαλιού', retail: 189, b2b: 149, tags: ['top'], shops: ['polykatastima', 'gynaikeia', 'esoroucha', 'gounarika'] },
    { id: 'p2', cat: 'koukles', name: 'Μπούστο ανδρικό ραπτικής', pack: 'ύφασμα λινό, ρυθμιζόμενο ύψος', retail: 69, b2b: 52, tags: ['new'], shops: ['andrika', 'polykatastima'] },
    { id: 'p13', cat: 'koukles', name: 'Κούκλα παιδική 6–8 ετών', pack: 'πλαστική, λευκή ματ', retail: 98, b2b: 76, tags: ['top'], shops: ['paidika', 'polykatastima'] },
    { id: 'p14', cat: 'koukles', name: 'Κούκλα αθλητική σε κίνηση', pack: 'μαύρη ματ, με βάση', retail: 215, b2b: 169, tags: ['new'], shops: ['athlitika', 'polykatastima'] },
    { id: 'p15', cat: 'koukles', name: 'Μπούστο εσωρούχων γυναικείο', pack: 'διάφανο, επιτραπέζιο', retail: 34, was: 39, b2b: 25, tags: ['offer'], shops: ['esoroucha'] },
    { id: 'p16', cat: 'koukles', name: 'Κεφάλι βιτρίνας για καπέλα και περούκες', pack: 'αφηρημένο, λευκό', retail: 29, b2b: 21, tags: [], shops: ['aksesouar', 'gynaikeia'] },
    { id: 'p3', cat: 'kremastres', name: 'Κρεμάστρα ξύλινη φυσική με μπάρα', pack: 'συσκευασία 50 τεμ.', retail: 42, was: 49, b2b: 31, tags: ['top', 'offer'], shops: ['polykatastima', 'gynaikeia', 'andrika', 'gounarika'] },
    { id: 'p4', cat: 'kremastres', name: 'Κρεμάστρα πλαστική μαύρη 42 cm', pack: 'συσκευασία 100 τεμ.', retail: 28, b2b: 19, tags: ['top'], shops: ['polykatastima', 'gynaikeia', 'athlitika', 'paidika'] },
    { id: 'p17', cat: 'kremastres', name: 'Κρεμάστρα παιδική πλαστική 30 cm', pack: 'συσκευασία 100 τεμ., χρώματα', retail: 24, b2b: 17, tags: ['new'], shops: ['paidika'] },
    { id: 'p18', cat: 'kremastres', name: 'Κρεμάστρα εσωρούχων με κλιπ', pack: 'συσκευασία 100 τεμ.', retail: 26, b2b: 18, tags: [], shops: ['esoroucha'] },
    { id: 'p19', cat: 'kremastres', name: 'Κρεμάστρα ενισχυμένη για παλτά και γούνες', pack: 'ξύλο οξιάς, 20 τεμ.', retail: 64, b2b: 48, tags: [], shops: ['gounarika', 'andrika'] },
    { id: 'p5', cat: 'rafieres', name: 'Πάνελ Chrome Grid 60×150 cm', pack: 'χρωμέ', retail: 24, b2b: 18, tags: ['top'], shops: ['aksesouar', 'kiniti', 'petshop'] },
    { id: 'p6', cat: 'rafieres', name: 'Ορθοστάτης modular χρωμέ 2 m', pack: 'με στηρίγματα τοίχου', retail: 16, b2b: 12, tags: ['new'], stock: 'order', shops: ['andrika', 'gynaikeia', 'ypodimata', 'vivliopoleia', 'polykatastima'] },
    { id: 'p20', cat: 'rafieres', name: 'Ραφιέρα φαρμακείου με φωτισμό LED 100 cm', pack: 'ύψος 220 cm, 6 ράφια', retail: 590, b2b: 465, tags: ['top'], stock: 'order', shops: ['farmakeia', 'kallyntika'] },
    { id: 'p21', cat: 'rafieres', name: 'Ραφιέρα τοίχου σούπερ μάρκετ 100×200 cm', pack: 'μεταλλική, 5 ράφια', retail: 210, was: 239, b2b: 168, tags: ['top', 'offer'], shops: ['supermarket', 'viologika', 'petshop'] },
    { id: 'p22', cat: 'rafieres', name: 'Ραφιέρα ξύλινη τύπου κασέτας', pack: 'μασίφ πεύκο, κλιμακωτή', retail: 185, b2b: 142, tags: ['new'], shops: ['viologika', 'vivliopoleia'] },
    { id: 'p23', cat: 'rafieres', name: 'Ράφι κρύσταλλο 10 mm, 60 cm', pack: 'με στηρίγματα, γυαλισμένες άκρες', retail: 38, b2b: 28, tags: [], shops: ['ypodimata', 'kallyntika', 'chrysochoia'] },
    { id: 'p46', cat: 'rafieres', name: 'Ραφιέρα βαρέως τύπου για ζωοτροφές', pack: 'φορτίο 150 kg/ράφι', retail: 245, b2b: 192, tags: [], stock: 'order', shops: ['petshop', 'supermarket'] },
    { id: 'p7', cat: 'slatwall', name: 'Πάνελ slatwall λευκό 120×120 cm', pack: 'MDF, 10 κανάλια', retail: 58, was: 66, b2b: 44, tags: ['offer', 'top'], shops: ['esoroucha', 'aksesouar', 'kiniti', 'mousika', 'athlitika'] },
    { id: 'p8', cat: 'slatwall', name: 'Γόνδολα διπλής όψης 125 cm', pack: 'με 4 ράφια ανά όψη', retail: 320, b2b: 255, tags: ['new'], stock: 'order', shops: ['supermarket', 'farmakeia', 'viologika', 'petshop', 'vivliopoleia'] },
    { id: 'p24', cat: 'slatwall', name: 'Γάντζος slatwall 20 cm', pack: 'συσκευασία 50 τεμ.', retail: 32, b2b: 23, tags: ['top'], shops: ['aksesouar', 'kiniti', 'mousika', 'petshop', 'esoroucha'] },
    { id: 'p25', cat: 'slatwall', name: 'Ακραία γόνδολα (κεφαλή) 90 cm', pack: 'με 4 ράφια', retail: 175, b2b: 139, tags: [], shops: ['supermarket', 'farmakeia'] },
    { id: 'p26', cat: 'slatwall', name: 'Βάση κιθάρας για slatwall', pack: 'με προστατευτικό λάστιχο', retail: 14, b2b: 10, tags: ['new'], shops: ['mousika'] },
    { id: 'p9', cat: 'stand', name: 'Καλόγερος ρούχων τροχήλατος', pack: 'ρυθμιζόμενο ύψος, χρωμέ', retail: 79, was: 92, b2b: 59, tags: ['offer', 'top'], shops: ['polykatastima', 'gynaikeia', 'andrika', 'paidika', 'athlitika', 'gounarika'] },
    { id: 'p27', cat: 'stand', name: 'Σταντ παπουτσιών 4 επιπέδων', pack: 'τροχήλατο, μαύρο', retail: 96, b2b: 74, tags: [], shops: ['ypodimata'] },
    { id: 'p28', cat: 'stand', name: 'Περιστρεφόμενο σταντ αξεσουάρ', pack: '4 όψεις, 32 γάντζοι', retail: 135, b2b: 104, tags: ['top'], shops: ['aksesouar', 'kiniti', 'vivliopoleia'] },
    { id: 'p29', cat: 'stand', name: 'Σταντ βιβλίων πυραμίδα', pack: 'ξύλινο, 4 επίπεδα', retail: 260, b2b: 205, tags: ['new'], stock: 'order', shops: ['vivliopoleia'] },
    { id: 'p30', cat: 'stand', name: 'Βάθρα προβολής λευκή λάκα', pack: 'σετ 3 τεμ., 30/45/60 cm', retail: 189, b2b: 148, tags: [], shops: ['stand', 'ypodimata', 'chrysochoia'] },
    { id: 'p31', cat: 'stand', name: 'Πάνελ gridwall 60×180 cm', pack: 'μαύρο, με ποδαρικά', retail: 46, b2b: 34, tags: [], shops: ['stand', 'aksesouar', 'athlitika'] },
    { id: 'p10', cat: 'kathreptes', name: 'Καθρέπτης δαπέδου 40×170 cm', pack: 'μαύρο μεταλλικό πλαίσιο', retail: 119, b2b: 92, tags: ['new'], shops: CLOTHES },
    { id: 'p32', cat: 'kathreptes', name: 'Καθρέπτης παπουτσιών χαμηλός', pack: 'κεκλιμένος, 30×40 cm', retail: 49, b2b: 36, tags: [], shops: ['ypodimata'] },
    { id: 'p33', cat: 'kathreptes', name: 'Καθρέπτης πάγκου περιστρεφόμενος', pack: 'διπλής όψης, μεγέθυνση ×3', retail: 39, b2b: 28, tags: [], shops: ['kallyntika', 'chrysochoia', 'aksesouar'] },
    { id: 'p11', cat: 'plexi', name: 'Θήκη τιμών plexiglass A6', pack: 'συσκευασία 10 τεμ.', retail: 22, was: 26, b2b: 15, tags: ['offer'], shops: ['supermarket', 'farmakeia', 'viologika', 'kallyntika', 'vivliopoleia'] },
    { id: 'p34', cat: 'plexi', name: 'Σταντ εντύπων A4 plexiglass', pack: 'επιδαπέδιο, 4 θέσεις', retail: 88, b2b: 66, tags: [], shops: ['stand', 'vivliopoleia', 'kiniti'] },
    { id: 'p35', cat: 'plexi', name: 'Βάση κινητού plexiglass', pack: 'συσκευασία 10 τεμ.', retail: 35, b2b: 24, tags: ['top'], shops: ['kiniti'] },
    { id: 'p36', cat: 'plexi', name: 'Διαχωριστικό ραφιού 30 cm', pack: 'συσκευασία 50 τεμ.', retail: 45, b2b: 32, tags: [], shops: ['farmakeia', 'supermarket', 'kallyntika'] },
    { id: 'p37', cat: 'plexi', name: 'Βάσεις κοσμημάτων plexiglass', pack: 'σετ 5 τεμ., λευκό/διάφανο', retail: 54, b2b: 39, tags: ['new'], shops: ['chrysochoia', 'aksesouar'] },
    { id: 'p12', cat: 'aksesouar', name: 'Αντικλεπτική ετικέτα RF', pack: 'συσκευασία 1000 τεμ.', retail: 65, b2b: 48, tags: ['top'], shops: [...CLOTHES, 'aksesouar', 'ypodimata', 'kallyntika'] },
    { id: 'p38', cat: 'aksesouar', name: 'Καλάθι αγορών πλαστικό με χερούλια', pack: 'συσκευασία 20 τεμ.', retail: 96, was: 110, b2b: 72, tags: ['offer'], shops: ['supermarket', 'viologika', 'farmakeia', 'petshop', 'kallyntika'] },
    { id: 'p39', cat: 'aksesouar', name: 'Αντικλεπτικές πύλες RF', pack: 'ζεύγος, με εγκατάσταση', retail: 1290, b2b: 1040, tags: [], stock: 'order', shops: ['supermarket', 'farmakeia', 'polykatastima', 'kiniti'] },
    { id: 'p40', cat: 'aksesouar', name: 'Ράγα τιμών για ράφι 100 cm', pack: 'συσκευασία 10 τεμ.', retail: 39, b2b: 27, tags: [], shops: ['supermarket', 'viologika', 'petshop'] },
    { id: 'p41', cat: 'kataskeves', name: 'Πάγκος ταμείου κατά παραγγελία', pack: 'μελαμίνη ή λάκα, μελέτη στο χώρο', retail: 890, b2b: 720, from: true, tags: [], stock: 'order', shops: ['farmakeia', 'polykatastima', 'chrysochoia', 'vivliopoleia', 'kiniti', 'mousika'] },
    { id: 'p42', cat: 'kataskeves', name: 'Βιτρίνα κοσμημάτων με LED', pack: 'κρύσταλλο ασφαλείας, κλειδαριά', retail: 1150, b2b: 930, from: true, tags: ['new'], stock: 'order', shops: ['chrysochoia'] },
    { id: 'p44', cat: 'kataskeves', name: 'Stand έκθεσης κατά παραγγελία', pack: 'τιμή ανά m², με τοποθέτηση', retail: 140, b2b: 115, from: true, tags: [], stock: 'order', shops: ['stand'] },
    { id: 'p45', cat: 'kataskeves', name: 'Πάγκος-βιτρίνα για μουσικά όργανα', pack: 'ξύλο και κρύσταλλο, 180 cm', retail: 760, b2b: 610, from: true, tags: [], stock: 'order', shops: ['mousika'] }
  ];
  const PROD = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
  const productsOf = (shopId) => PRODUCTS.filter((p) => p.shops.includes(shopId));
  SHOPS.forEach((s) => { s.count = productsOf(s.id).length; });

  /* =========================================================
     ΛΙΑΝΙΚΗ / B2B
     ========================================================= */
  const isB2B = () => !document.body.classList.contains('is-b2c');
  const setMode = (mode) => {
    document.body.classList.toggle('is-b2c', mode === 'b2c');
    $$('.segmented__btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    store.set('ns-mode', mode);
    document.dispatchEvent(new CustomEvent('ns:mode', { detail: mode }));
  };
  document.addEventListener('click', (e) => { const b = e.target.closest('.segmented__btn'); if (b) setMode(b.dataset.mode); });
  document.body.classList.toggle('is-b2c', store.get('ns-mode', 'b2b') === 'b2c');
  $$('.segmented__btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === (isB2B() ? 'b2b' : 'b2c'))));

  /* =========================================================
     HERO SLIDER — κάθε slide είναι ένα κατάστημα με φωτογραφία
     ========================================================= */
  const hero = $('.hero');
  const viewport = $('.hero__viewport');
  const track = $('#heroTrack');
  const total = SHOPS.length;

  track.innerHTML = SHOPS.map((s, i) => {
    const g = GROUP[s.group];
    const h = i === 0 ? 'h1' : 'h2';
    return `<article class="slide ${s.dark ? 'slide--dark' : ''}" style="--c:${s.c}" data-shop="${s.id}">
      <div class="wrap slide__inner">
        <div class="slide__copy">
          <p class="slide__kicker">Κατάστημα ${pad(i + 1)} / ${pad(total)} · ${esc(g.name)}</p>
          <${h} class="slide__title" style="--len:${s.len}">${s.title}</${h}>
          <p class="slide__text">${esc(s.text)}</p>
          <ul class="chips">${s.needs.slice(0, 4).map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
          <div class="slide__cta">
            <a class="btn ${s.dark ? 'btn--light' : 'btn--ink'}" href="#katastima/${s.id}">Δες τα προϊόντα (${s.count}) ${icon('i-arrow')}</a>
            <a class="btn btn--ghost" href="#b2b">Τιμές χονδρικής</a>
          </div>
        </div>
        <a class="slide__art" href="#katastima/${s.id}" tabindex="-1" aria-hidden="true">
          <span class="photo">${img(s, '', i !== 0)}</span>
          <span class="slide__badge">B2B<br><small>τιμές</small></span>
          <span class="photo__label">Έργο New System</span>
        </a>
      </div>
    </article>`;
  }).join('');

  const slides = Array.from(track.children);
  const prevBtn = $('.hero .arrow--prev');
  const nextBtn = $('.hero .arrow--next');
  const tabsEl = $('.hero__tabs');
  const countEl = $('.hero__count');
  const barEl = $('.hero__progress b');
  const AUTOPLAY_MS = 7000;
  let index = 0;

  slides.forEach((s, i) => {
    s.id = `slide-${i + 1}`;
    s.setAttribute('role', 'tabpanel');
    s.setAttribute('aria-roledescription', 'slide');
    s.setAttribute('aria-label', `${i + 1} από ${total}: ${SHOPS[i].name}`);
  });

  const tabs = SHOPS.map((s, i) => {
    const t = document.createElement('button');
    t.type = 'button';
    t.className = 'tab';
    t.setAttribute('role', 'tab');
    t.setAttribute('aria-controls', slides[i].id);
    t.style.setProperty('--tc', s.c);
    t.innerHTML = `<i><img src="${s.img}" alt="" width="26" height="26" loading="lazy"></i>${esc(s.short)}`;
    t.addEventListener('click', () => go(i));
    tabsEl.appendChild(t);
    return t;
  });

  const paintArrow = (btn, s) => {
    $('.arrow__name', btn).textContent = s.short;
    const thumb = $('.arrow__thumb', btn);
    thumb.style.setProperty('--tc', s.c);
    $('img', thumb).src = s.img;
  };
  const warm = (i) => { $$('img', slides[(i + total) % total]).forEach((im) => { im.loading = 'eager'; }); };

  function go(i) {
    index = (i + total) % total;
    track.style.transform = `translateX(${-index * 100}%)`;
    slides.forEach((s, n) => {
      const active = n === index;
      s.classList.toggle('is-active', active);
      s.setAttribute('aria-hidden', String(!active));
      s.inert = !active;
    });
    tabs.forEach((t, n) => {
      const active = n === index;
      t.setAttribute('aria-selected', String(active));
      t.tabIndex = active ? 0 : -1;
    });
    const prev = SHOPS[(index - 1 + total) % total];
    const next = SHOPS[(index + 1) % total];
    paintArrow(prevBtn, prev);
    paintArrow(nextBtn, next);
    prevBtn.setAttribute('aria-label', `Προηγούμενο κατάστημα: ${prev.name}`);
    nextBtn.setAttribute('aria-label', `Επόμενο κατάστημα: ${next.name}`);
    countEl.textContent = `${pad(index + 1)} / ${pad(total)}`;
    warm(index); warm(index + 1); warm(index - 1);
    // κεντράρει το ενεργό tab χωρίς να μετακινεί τη σελίδα
    const t = tabs[index];
    tabsEl.scrollTo({ left: t.offsetLeft - (tabsEl.clientWidth - t.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
    restart();
  }

  prevBtn.addEventListener('click', () => go(index - 1));
  nextBtn.addEventListener('click', () => go(index + 1));

  tabsEl.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      go(index + (e.key === 'ArrowRight' ? 1 : -1));
      tabs[index].focus({ preventScroll: true });
    }
  });
  viewport.tabIndex = -1;
  hero.addEventListener('keydown', (e) => {
    if (e.target.closest('.hero__tabs, input, select')) return;
    if (e.key === 'ArrowRight') go(index + 1);
    if (e.key === 'ArrowLeft') go(index - 1);
  });

  /* autoplay με μπάρα προόδου — σταματά σε hover/focus/κρυφή καρτέλα/σελίδα καταστήματος */
  let start = 0, elapsed = 0, raf = 0, paused = false, away = false;
  const stopped = reduceMotion;
  const tick = (now) => {
    if (!start) start = now - elapsed;
    elapsed = now - start;
    barEl.style.width = `${Math.min(elapsed / AUTOPLAY_MS, 1) * 100}%`;
    if (elapsed >= AUTOPLAY_MS) { go(index + 1); return; }
    raf = requestAnimationFrame(tick);
  };
  function restart() {
    cancelAnimationFrame(raf);
    start = 0; elapsed = 0;
    barEl.style.width = stopped ? `${((index + 1) / total) * 100}%` : '0%';
    if (!stopped && !paused && !away) raf = requestAnimationFrame(tick);
  }
  const pause = () => { paused = true; cancelAnimationFrame(raf); start = 0; };
  const resume = () => { if (!paused) return; paused = false; if (!stopped && !away) raf = requestAnimationFrame(tick); };
  const setAway = (v) => { away = v; cancelAnimationFrame(raf); start = 0; if (!v && !paused && !stopped) raf = requestAnimationFrame(tick); };
  hero.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') pause(); });
  hero.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') resume(); });
  hero.addEventListener('focusin', pause);
  hero.addEventListener('focusout', (e) => { if (!hero.contains(e.relatedTarget)) resume(); });
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : resume()));

  /* swipe σε κινητό / tablet */
  let x0 = null, y0 = 0, dx = 0, locked = null, ptype = '';
  viewport.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest('.slide__copy a, button, input, select')) return;
    x0 = e.clientX; y0 = e.clientY; dx = 0; locked = null; ptype = e.pointerType;
  });
  viewport.addEventListener('pointermove', (e) => {
    if (x0 === null) return;
    const mx = e.clientX - x0, my = e.clientY - y0;
    if (locked === null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) {
      locked = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
      if (locked === 'x') { viewport.setPointerCapture(e.pointerId); track.classList.add('is-dragging'); pause(); }
    }
    if (locked !== 'x') return;
    dx = mx;
    track.style.transform = `translateX(calc(${-index * 100}% + ${dx}px))`;
  });
  let swiped = false;
  const endDrag = () => {
    if (x0 === null) return;
    const wasX = locked === 'x';
    x0 = null; locked = null;
    track.classList.remove('is-dragging');
    if (!wasX) return;
    swiped = true; setTimeout(() => { swiped = false; }, 0);
    const threshold = Math.min(90, viewport.clientWidth * 0.18);
    if (ptype !== 'mouse') paused = false;
    if (dx < -threshold) go(index + 1);
    else if (dx > threshold) go(index - 1);
    else go(index);
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  // μετά από σύρσιμο, το "κλικ" στη φωτογραφία δεν ανοίγει το κατάστημα
  viewport.addEventListener('click', (e) => { if (swiped && e.target.closest('.slide__art')) e.preventDefault(); }, true);

  go(0);

  /* =========================================================
     ΒΟΗΘΗΤΙΚΑ: αναζήτηση χωρίς τόνους, τιμές, toast
     ========================================================= */
  const fold = (ch) => ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace('ς', 'σ').charAt(0) || ch;
  const norm = (str) => Array.from(str).map(fold).join('');
  const highlight = (text, q) => {
    if (!q) return esc(text);
    const i = norm(text).indexOf(norm(q));
    if (i < 0) return esc(text);
    const chars = Array.from(text), n = Array.from(q).length;
    return esc(chars.slice(0, i).join('')) + '<mark>' + esc(chars.slice(i, i + n).join('')) + '</mark>' + esc(chars.slice(i + n).join(''));
  };
  const shopText = (s) => `${s.name} ${s.short} ${s.needs.join(' ')} ${GROUP[s.group].name}`;
  const prodText = (p) => `${p.name} ${p.pack} ${TYPE[p.cat].name} ${TYPE[p.cat].subs.join(' ')} ${p.shops.map((id) => SHOP[id].name).join(' ')}`;
  const matches = (p, q) => !q || norm(prodText(p)).includes(norm(q));

  const priceOf = (p) => (isB2B() ? p.b2b : p.retail);
  const priceHTML = (p) => {
    let old = '', tag = '';
    if (isB2B()) {
      old = `<s class="price__old">${fmt(p.retail)}</s>`;
      tag = `<span class="price__tag">B2B −${Math.round((1 - p.b2b / p.retail) * 100)}%</span>`;
    } else if (p.was) {
      old = `<s class="price__old">${fmt(p.was)}</s>`;
      tag = `<span class="price__tag">−${Math.round((1 - p.retail / p.was) * 100)}%</span>`;
    }
    return `<div class="price">${p.from ? '<small class="price__from">από</small>' : ''}<span class="price__now">${fmt(priceOf(p))}</span>${old}${tag}<span class="price__vat">${isB2B() ? 'τιμή B2B · ' : ''}με ΦΠΑ</span></div>`;
  };

  const toastEl = $('#toast');
  let toastT = 0;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('is-on'), 2600);
  };
  const bump = (el) => { if (!el || reduceMotion) return; el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump'); };

  /* ---------- κατάσταση ---------- */
  const state = { tab: 'top', q: '', cat: '', fav: false };
  const cart = new Map(Object.entries(store.get('ns4-cart', {})).filter(([id]) => PROD[id]));
  const favs = new Set(store.get('ns4-favs', []).filter((id) => PROD[id]));

  /* =========================================================
     STICKERS ΚΑΤΑΣΤΗΜΑΤΩΝ (με φωτογραφία)
     ========================================================= */
  const ROT = [-3, 2.5, -1.5, 3.5, -4, 1.5, -2.5, 3];
  const stickerHTML = (s, i) => `<li data-group="${s.group}"><a class="sticker sticker--shop ${s.dark ? 'sticker--dark' : ''}" href="#katastima/${s.id}" style="--c:${s.c};--r:${ROT[i % ROT.length]}deg">
      <span class="sticker__photo">${img(s)}</span>
      <span class="sticker__name">${esc(s.name)}</span>
      <span class="sticker__meta">${s.count} προϊόντα · ${esc(s.needs.slice(0, 2).join(' · '))}</span>
      <span class="sticker__b2b">B2B</span>
    </a></li>`;
  const stickersEl = $('#stickers');
  stickersEl.innerHTML = SHOPS.map(stickerHTML).join('');

  const groupChips = $('#groupChips');
  groupChips.innerHTML = [{ id: '', name: 'Όλα τα καταστήματα', c: '#fff' }, ...GROUPS]
    .map((g) => `<button type="button" class="gchip" data-group="${g.id}" aria-pressed="${g.id === ''}" style="--c:${g.c}">${g.icon ? `<i>${icon(g.icon)}</i>` : ''}${esc(g.name)} <small>${g.id ? SHOPS.filter((s) => s.group === g.id).length : SHOPS.length}</small></button>`).join('');
  const filterStickers = (gid) => {
    $$('.gchip', groupChips).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.group === gid)));
    $$('li', stickersEl).forEach((li) => { li.hidden = !!gid && li.dataset.group !== gid; });
  };
  groupChips.addEventListener('click', (e) => { const b = e.target.closest('.gchip'); if (b) filterStickers(b.dataset.group); });

  const revealStickers = (root) => {
    const lis = $$('.stickers li', root);
    if ('IntersectionObserver' in window && !reduceMotion) {
      const io = new IntersectionObserver((entries) => {
        entries.filter((en) => en.isIntersecting).forEach((en, n) => {
          en.target.style.transitionDelay = `${n * 60}ms`;
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
      lis.forEach((li) => io.observe(li));
    } else {
      lis.forEach((li) => li.classList.add('is-in'));
    }
  };
  revealStickers(document);

  /* =========================================================
     ΜΠΑΡΑ ΚΑΤΗΓΟΡΙΩΝ + MEGA MENU
     ========================================================= */
  const catbar = $('#catbar');
  const mega = $('#mega');
  const megaInner = $('.mega__inner', mega);
  const BAR = [...GROUPS, { id: 'proionta', name: 'Τύποι προϊόντων', short: 'Προϊόντα', icon: 'i-grid', c: '#fff' }];
  catbar.innerHTML = `<li><a class="catbar__btn catbar__all" href="#katigories"><i style="--c:var(--ink)" class="is-dark">${icon('i-store')}</i>Όλα τα μαγαζιά</a></li>`
    + BAR.map((g) => `<li><button class="catbar__btn" type="button" data-cat="${g.id}" aria-expanded="false" aria-controls="mega"><i style="--c:${g.c}">${icon(g.icon)}</i>${esc(g.short)}</button></li>`).join('');
  const catBtns = $$('button.catbar__btn', catbar);
  let openCat = '';

  const renderMega = (id) => {
    if (id === 'proionta') {
      megaInner.className = 'wrap mega__inner mega__inner--types';
      megaInner.innerHTML = `
        <div class="mega__hero is-dark" style="--c:var(--ink)">
          <span class="sticker__icon">${icon('i-grid')}</span>
          <div><b>Τύποι προϊόντων</b><a href="#proionta" data-show-cat="">Όλα τα προϊόντα ${icon('i-arrow')}</a></div>
        </div>
        <div class="mega__types">${TYPES.map((t) => `<a href="#proionta" data-show-cat="${t.id}" style="--c:${t.c}"><i class="${t.dark ? 'is-dark' : ''}">${icon(t.icon)}</i><span><b>${esc(t.name)}</b><small>${PRODUCTS.filter((p) => p.cat === t.id).length} προϊόντα</small></span></a>`).join('')}</div>
        <div class="mega__promo"><b>Είσαι κατάστημα; <span>Τιμές B2B</span> σε όλα τα προϊόντα.</b><p>Άνοιξε λογαριασμό με το ΑΦΜ σου.</p><a class="btn btn--yellow" href="#b2b">Αίτηση B2B ${icon('i-arrow')}</a></div>`;
      return;
    }
    const g = GROUP[id];
    const shops = SHOPS.filter((s) => s.group === id);
    megaInner.className = 'wrap mega__inner';
    megaInner.innerHTML = `
      <div class="mega__hero" style="--c:${g.c}">
        <span class="sticker__icon">${icon(g.icon)}</span>
        <div><b>${esc(g.name)}</b><small>${shops.length} τύποι καταστημάτων · ${new Set(shops.flatMap((s) => productsOf(s.id).map((p) => p.id))).size} προϊόντα</small></div>
      </div>
      <ul class="mega__shops">${shops.map((s) => `<li><a href="#katastima/${s.id}" style="--c:${s.c}"><span class="mega__ph">${img(s)}</span><span><b>${esc(s.name)}</b><small>${s.count} προϊόντα</small></span></a></li>`).join('')}</ul>
      <div class="mega__promo"><b>Ανοίγεις <span>${esc(g.short.toLowerCase())}</span>;</b><p>Δωρεάν μελέτη καταστήματος και τιμές B2B σε όλα τα προϊόντα.</p><a class="btn btn--yellow" href="#kataskeves">Ζήτησε μελέτη ${icon('i-arrow')}</a></div>`;
  };
  const setMega = (id) => {
    openCat = id;
    catBtns.forEach((b) => b.setAttribute('aria-expanded', String(b.dataset.cat === id)));
    if (id) { renderMega(id); mega.hidden = false; } else { mega.hidden = true; }
  };
  catbar.addEventListener('click', (e) => {
    const b = e.target.closest('button.catbar__btn');
    if (!b) return;
    // αν μόλις άνοιξε με hover, το κλικ δεν το ξανακλείνει
    if (openCat === b.dataset.cat && Date.now() - hoverAt < 600) return;
    setMega(openCat === b.dataset.cat ? '' : b.dataset.cat);
  });
  // hover μόνο σε συσκευές με ποντίκι
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let hoverT = 0, hoverAt = 0;
  catbar.addEventListener('mouseover', (e) => {
    const b = e.target.closest('.catbar__btn');
    if (!finePointer.matches || !b) return;
    clearTimeout(hoverT);
    hoverT = setTimeout(() => { if (openCat !== (b.dataset.cat || '')) hoverAt = Date.now(); setMega(b.dataset.cat || ''); }, openCat ? 60 : 180);
  });
  const navEl = $('.catbar');
  navEl.addEventListener('mouseleave', () => { if (!finePointer.matches) return; clearTimeout(hoverT); hoverT = setTimeout(() => setMega(''), 260); });
  navEl.addEventListener('mouseenter', () => clearTimeout(hoverT));
  document.addEventListener('click', (e) => { if (openCat && !e.target.closest('.catbar__btn, .mega')) setMega(''); });
  mega.addEventListener('click', (e) => { if (e.target.closest('a')) setMega(''); });

  /* =========================================================
     ΚΑΡΤΕΣ ΠΡΟΪΟΝΤΩΝ (κοινές για αρχική και σελίδα καταστήματος)
     ========================================================= */
  const cardHTML = (p, ctx) => {
    const c = TYPE[p.cat];
    const badge = p.tags.includes('offer') ? '<span class="product__badge product__badge--offer">Προσφορά</span>'
      : p.tags.includes('new') ? '<span class="product__badge product__badge--new">Νέο</span>'
      : p.tags.includes('top') ? '<span class="product__badge">🔥 Top</span>' : '';
    const inCart = cart.has(p.id);
    const others = p.shops.filter((id) => id !== ctx);
    const forLine = others.length
      ? `<span class="product__shops">${ctx ? 'Και για' : 'Για'}: ${others.slice(0, 2).map((id) => `<a href="#katastima/${id}">${esc(SHOP[id].short)}</a>`).join(', ')}${others.length > 2 ? ` +${others.length - 2}` : ''}</span>` : '';
    return `<li><article class="product" data-id="${p.id}" style="--c:${c.c}">
      <div class="product__media">${badge}<span class="product__sticker ${c.dark ? 'is-dark' : ''}">${icon(c.icon)}</span>
        <button class="product__fav" type="button" aria-pressed="${favs.has(p.id)}" aria-label="${favs.has(p.id) ? 'Αφαίρεση από' : 'Προσθήκη στα'} αγαπημένα: ${esc(p.name)}">${icon('i-heart')}</button></div>
      <div class="product__body">
        <span class="product__cat">${esc(c.name)}</span>
        <h3 class="product__name">${esc(p.name)}</h3>
        <span class="product__pack">${esc(p.pack)}</span>
        ${forLine}
        <span class="product__stock ${p.stock === 'order' ? 'product__stock--order' : ''}">${p.stock === 'order' ? 'Κατόπιν παραγγελίας' : 'Σε απόθεμα'}</span>
        ${priceHTML(p)}
        <button class="btn btn--ink btn--block product__add ${inCart ? 'is-added' : ''}" type="button">${icon(inCart ? 'i-check' : 'i-cart')} <span>${inCart ? `Στο καλάθι (${cart.get(p.id)})` : 'Στο καλάθι'}</span></button>
      </div></article></li>`;
  };

  /* ---------- αρχική: rail προϊόντων ---------- */
  const list = $('#products');
  const result = $('#shopResult');
  const shopTabs = $$('.shop-tab');
  const shopSec = $('#proionta');

  const visible = () => PRODUCTS.filter((p) => {
    if (state.fav) return favs.has(p.id);
    if (state.q || state.cat) return (!state.cat || p.cat === state.cat) && matches(p, state.q);
    return state.tab === 'all' || p.tags.includes(state.tab);
  });

  const renderProducts = () => {
    const items = visible();
    list.innerHTML = items.length ? items.map((p) => cardHTML(p, '')).join('') : `<li class="products__empty">${state.fav ? 'Δεν έχεις αγαπημένα ακόμα. Πάτα την καρδιά σε ένα προϊόν.' : 'Δεν βρέθηκαν προϊόντα. Δοκίμασε άλλη αναζήτηση ή διάλεξε κατάστημα.'}</li>`;
    const filtered = state.fav || state.q || state.cat;
    shopTabs.forEach((t) => t.setAttribute('aria-selected', String(!filtered && t.dataset.filter === state.tab)));
    if (filtered) {
      const what = state.fav ? 'στα αγαπημένα σου' : [state.q && `για «${esc(state.q)}»`, state.cat && `στον τύπο ${esc(TYPE[state.cat].name)}`].filter(Boolean).join(' ');
      result.innerHTML = `${items.length} ${items.length === 1 ? 'προϊόν' : 'προϊόντα'} ${what} <button type="button" data-clear>Καθαρισμός</button>`;
    } else {
      result.textContent = '';
    }
    list.scrollLeft = 0;
    updateRail();
  };

  const scrollToEl = (el) => el && el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  /* δείχνει τα αποτελέσματα στην αρχική (φεύγει από τη σελίδα καταστήματος αν χρειάζεται) */
  const showShop = (f) => {
    Object.assign(state, { q: '', cat: '', fav: false }, f);
    setMega('');
    renderProducts();
    if (location.hash !== '#proionta') location.hash = 'proionta';
    else scrollToEl(shopSec);
  };
  const highlightProduct = (id) => {
    const el = $(`.product[data-id="${id}"]`, list);
    if (el && !reduceMotion) el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04) rotate(-1deg)' }, { transform: 'scale(1)' }], { duration: 600, delay: 500 });
  };

  shopTabs.forEach((t) => t.addEventListener('click', () => { Object.assign(state, { tab: t.dataset.filter, q: '', cat: '', fav: false }); q.value = ''; qcat.value = ''; renderProducts(); }));
  result.addEventListener('click', (e) => { if (e.target.closest('[data-clear]')) { Object.assign(state, { q: '', cat: '', fav: false }); q.value = ''; qcat.value = ''; renderProducts(); } });

  // links προς τύπο προϊόντων (mega menu, footer)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-show-cat]');
    if (!a) return;
    e.preventDefault();
    q.value = '';
    qcat.value = a.dataset.showCat;
    showShop({ cat: a.dataset.showCat, tab: a.dataset.showCat ? state.tab : 'all' });
  });

  // βελάκια του rail
  const prevR = $('.rail__btn--prev');
  const nextR = $('.rail__btn--next');
  function updateRail() {
    const max = list.scrollWidth - list.clientWidth - 2;
    prevR.disabled = list.scrollLeft <= 2;
    nextR.disabled = list.scrollLeft >= max;
  }
  const step = (d) => list.scrollBy({ left: d * list.clientWidth * 0.9, behavior: reduceMotion ? 'auto' : 'smooth' });
  prevR.addEventListener('click', () => step(-1));
  nextR.addEventListener('click', () => step(1));
  list.addEventListener('scroll', updateRail, { passive: true });
  window.addEventListener('resize', updateRail);

  /* ---------- αγαπημένα & καλάθι από οποιαδήποτε κάρτα ---------- */
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.product');
    if (!card) return;
    const p = PROD[card.dataset.id];
    if (e.target.closest('.product__fav')) {
      favs.has(p.id) ? favs.delete(p.id) : favs.add(p.id);
      store.set('ns4-favs', [...favs]);
      updateCounts();
      if (state.fav && card.closest('#products')) renderProducts();
      else {
        $$(`.product[data-id="${p.id}"] .product__fav`).forEach((b) => {
          b.setAttribute('aria-pressed', String(favs.has(p.id)));
          b.setAttribute('aria-label', `${favs.has(p.id) ? 'Αφαίρεση από' : 'Προσθήκη στα'} αγαπημένα: ${p.name}`);
        });
      }
      bump($('#wishBtn'));
      toast(favs.has(p.id) ? '♥ Προστέθηκε στα αγαπημένα' : 'Αφαιρέθηκε από τα αγαπημένα');
    } else if (e.target.closest('.product__add')) {
      addToCart(p.id, 1);
      toast(`✓ ${p.name}: στο καλάθι`);
    }
  });

  /* =========================================================
     ΣΕΛΙΔΑ ΚΑΤΗΓΟΡΙΑΣ-ΚΑΤΑΣΤΗΜΑΤΟΣ  (#katastima/<id>)
     ========================================================= */
  const view = $('#shopview');
  const sv = { shop: null, type: '', sort: 'rec' };
  const svGrid = $('#svGrid');
  const svFilters = $('#svFilters');
  const svSort = $('#svSort');
  const baseTitle = document.title;

  const renderSvProducts = () => {
    const s = sv.shop;
    let items = productsOf(s.id).filter((p) => !sv.type || p.cat === sv.type);
    if (sv.sort !== 'rec') items = items.slice().sort((a, b) => (sv.sort === 'asc' ? 1 : -1) * (priceOf(a) - priceOf(b)));
    svGrid.innerHTML = items.map((p) => cardHTML(p, s.id)).join('');
    $('#svCount').textContent = `${items.length} ${items.length === 1 ? 'προϊόν' : 'προϊόντα'}${sv.type ? ` στον τύπο ${TYPE[sv.type].name}` : ''}`;
    $$('.svfilter', svFilters).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.type === sv.type)));
  };

  const paintLink = (a, s) => {
    a.href = `#katastima/${s.id}`;
    $('.arrow__name', a).textContent = s.short;
    $('.arrow__thumb', a).style.setProperty('--tc', s.c);
    $('.arrow__thumb img', a).src = s.img;
    a.setAttribute('aria-label', `${a.id === 'svPrev' ? 'Προηγούμενο' : 'Επόμενο'} κατάστημα: ${s.name}`);
  };

  const renderShopView = (s) => {
    const i = SHOPS.indexOf(s);
    const g = GROUP[s.group];
    sv.shop = s; sv.type = ''; sv.sort = 'rec'; svSort.value = 'rec';
    view.style.setProperty('--c', s.c);
    $('#svHero').classList.toggle('is-dark', !!s.dark);
    $('#svCrumb').textContent = s.name;
    const im = $('#svImg');
    im.src = s.img; im.alt = s.alt;
    $('#svCap').textContent = `New System | ${s.name.toLocaleUpperCase('el-GR').normalize('NFD').replace(/[́]/g, '').normalize('NFC')}`;
    $('#svKicker').textContent = `Κατάστημα ${pad(i + 1)} / ${pad(total)} · ${g.name}`;
    $('#svTitle').innerHTML = s.title;
    $('#svTitle').style.setProperty('--len', s.len);
    $('#svText').textContent = s.text;
    $('#svNeeds').innerHTML = s.needs.map((n) => `<li>${esc(n)}</li>`).join('');
    $('#svFor').textContent = s.name.toLowerCase();
    $('#svJump').innerHTML = `Δες τα ${s.count} προϊόντα ${icon('i-arrow')}`;
    const prods = productsOf(s.id);
    const types = TYPES.filter((t) => prods.some((p) => p.cat === t.id));
    svFilters.innerHTML = `<button type="button" class="svfilter" data-type="" aria-pressed="true">Όλα <small>${prods.length}</small></button>`
      + types.map((t) => `<button type="button" class="svfilter" data-type="${t.id}" aria-pressed="false" style="--c:${t.c}"><i class="${t.dark ? 'is-dark' : ''}">${icon(t.icon)}</i>${esc(t.short)} <small>${prods.filter((p) => p.cat === t.id).length}</small></button>`).join('');
    renderSvProducts();
    paintLink($('#svPrev'), SHOPS[(i - 1 + total) % total]);
    paintLink($('#svNext'), SHOPS[(i + 1) % total]);
    const rel = SHOPS.filter((o) => o.group === s.group && o.id !== s.id);
    $('#svRelTitle').textContent = `Άλλα καταστήματα: ${g.name}`;
    const relEl = $('#svRelated');
    relEl.innerHTML = rel.map(stickerHTML).join('');
    $$('li', relEl).forEach((li) => li.classList.add('is-in'));
    document.title = `${s.name} · New System`;
  };

  svFilters.addEventListener('click', (e) => { const b = e.target.closest('.svfilter'); if (b) { sv.type = b.dataset.type; renderSvProducts(); } });
  svSort.addEventListener('change', () => { sv.sort = svSort.value; renderSvProducts(); });
  $('#svJump').addEventListener('click', (e) => { e.preventDefault(); scrollToEl($('#svProducts')); });

  /* ---------- router: το back του browser γυρίζει στην προηγούμενη προβολή ---------- */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  let homeY = 0;
  const route = () => {
    const m = location.hash.match(/^#katastima\/([\w-]+)/);
    const s = m && SHOP[m[1]];
    setMega('');
    closeSuggest();
    if (s) {
      if (view.hidden) homeY = window.scrollY;
      renderShopView(s);
      view.hidden = false;
      document.body.classList.add('is-shopview');
      setAway(true);
      window.scrollTo(0, 0);
      $('#svTitle').focus({ preventScroll: true });
      return;
    }
    const wasView = !view.hidden;
    view.hidden = true;
    document.body.classList.remove('is-shopview');
    document.title = baseTitle;
    setAway(false);
    const id = decodeURIComponent(location.hash.slice(1));
    const target = id && document.getElementById(id);
    if (target) {
      // περιμένει να εμφανιστεί η αρχική πριν κυλήσει
      requestAnimationFrame(() => (wasView ? target.scrollIntoView({ block: 'start' }) : scrollToEl(target)));
    } else if (wasView) {
      window.scrollTo(0, homeY);
    } else if (!location.hash || location.hash === '#') {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  };
  window.addEventListener('hashchange', route);

  /* =========================================================
     ΑΝΑΖΗΤΗΣΗ ΜΕ ΠΡΟΤΑΣΕΙΣ: καταστήματα, τύποι, προϊόντα
     ========================================================= */
  const form = $('#search');
  const q = $('#q');
  const qcat = $('#qcat');
  const sug = $('#suggest');
  qcat.insertAdjacentHTML('beforeend', TYPES.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join(''));
  let sugItems = [];
  let sugIndex = -1;

  function closeSuggest() { sug.hidden = true; q.setAttribute('aria-expanded', 'false'); q.removeAttribute('aria-activedescendant'); sugIndex = -1; }
  const renderSuggest = () => {
    const term = q.value.trim();
    if (!term) { closeSuggest(); return; }
    const t = norm(term);
    const shops = qcat.value ? [] : SHOPS.filter((s) => norm(shopText(s)).includes(t)).slice(0, 3);
    const types = TYPES.filter((c) => (!qcat.value || c.id === qcat.value) && norm(`${c.name} ${c.subs.join(' ')}`).includes(t)).slice(0, 2);
    const prods = PRODUCTS.filter((p) => (!qcat.value || p.cat === qcat.value) && matches(p, term)).slice(0, 5);
    sugItems = [...shops.map((s) => ({ type: 'shop', s })), ...types.map((c) => ({ type: 'cat', c })), ...prods.map((p) => ({ type: 'prod', p }))];
    let html = '', n = 0;
    if (shops.length) html += '<li class="suggest__label" role="presentation">Καταστήματα</li>' + shops.map((s) => { const i = n++; return `<li class="suggest__item" role="option" id="sg${i}" data-i="${i}" aria-selected="false"><span class="suggest__ic suggest__ic--ph" style="--c:${s.c}"><img src="${s.img}" alt="" width="36" height="36"></span><span class="suggest__txt"><b>${highlight(s.name, term)}</b><small>${s.count} προϊόντα · ${esc(s.needs.slice(0, 2).join(' · '))}</small></span></li>`; }).join('');
    if (types.length) html += '<li class="suggest__label" role="presentation">Τύποι προϊόντων</li>' + types.map((c) => { const i = n++; return `<li class="suggest__item" role="option" id="sg${i}" data-i="${i}" aria-selected="false"><span class="suggest__ic ${c.dark ? 'is-dark' : ''}" style="--c:${c.c}">${icon(c.icon)}</span><span class="suggest__txt"><b>${highlight(c.name, term)}</b><small>${c.subs.slice(0, 3).join(' · ')}</small></span></li>`; }).join('');
    if (prods.length) html += '<li class="suggest__label" role="presentation">Προϊόντα</li>' + prods.map((p) => { const i = n++; const c = TYPE[p.cat]; return `<li class="suggest__item" role="option" id="sg${i}" data-i="${i}" aria-selected="false"><span class="suggest__ic ${c.dark ? 'is-dark' : ''}" style="--c:${c.c}">${icon(c.icon)}</span><span class="suggest__txt"><b>${highlight(p.name, term)}</b><small>${esc(c.name)} · ${esc(p.pack)}</small></span><span class="suggest__price">${fmt(priceOf(p))}</span></li>`; }).join('');
    if (!sugItems.length) html = `<li class="suggest__none">Δεν βρέθηκε κάτι για «${esc(term)}». Δοκίμασε «φαρμακείο» ή «κρεμάστρα».</li>`;
    sug.innerHTML = html;
    sug.hidden = false;
    q.setAttribute('aria-expanded', 'true');
    sugIndex = -1;
  };
  const moveSuggest = (d) => {
    if (!sugItems.length) return;
    sugIndex = (sugIndex + d + sugItems.length) % sugItems.length;
    $$('.suggest__item', sug).forEach((li) => li.setAttribute('aria-selected', String(+li.dataset.i === sugIndex)));
    q.setAttribute('aria-activedescendant', `sg${sugIndex}`);
    $(`#sg${sugIndex}`)?.scrollIntoView({ block: 'nearest' });
  };
  const pickSuggest = (i) => {
    const it = sugItems[i];
    if (!it) return;
    closeSuggest();
    if (it.type === 'shop') { q.value = ''; q.blur(); location.hash = `katastima/${it.s.id}`; }
    else if (it.type === 'cat') { q.value = ''; qcat.value = it.c.id; showShop({ cat: it.c.id }); }
    else { q.value = it.p.name; showShop({ q: it.p.name, cat: it.p.cat }); highlightProduct(it.p.id); }
  };
  q.addEventListener('input', renderSuggest);
  q.addEventListener('focus', renderSuggest);
  qcat.addEventListener('change', renderSuggest);
  q.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveSuggest(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveSuggest(-1); }
    else if (e.key === 'Escape') closeSuggest();
    else if (e.key === 'Enter' && sugIndex >= 0) { e.preventDefault(); pickSuggest(sugIndex); }
  });
  sug.addEventListener('mousedown', (e) => e.preventDefault());
  sug.addEventListener('click', (e) => { const li = e.target.closest('.suggest__item'); if (li) pickSuggest(+li.dataset.i); });
  document.addEventListener('click', (e) => { if (!e.target.closest('.search')) closeSuggest(); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    closeSuggest();
    const term = q.value.trim();
    // όνομα καταστήματος (π.χ. «φαρμακείο») → σελίδα καταστήματος
    const t = norm(term);
    const stem = t.length > 6 ? t.slice(0, -2) : t;
    const exact = !qcat.value && stem.length >= 5 && SHOPS.find((s) => norm(s.name).startsWith(stem) || norm(s.short).startsWith(stem));
    if (exact) { q.value = ''; location.hash = `katastima/${exact.id}`; return; }
    showShop({ q: term, cat: qcat.value });
  });

  /* =========================================================
     ΚΑΛΑΘΙ
     ========================================================= */
  const cartEl = $('#cart');
  const scrim = $('#scrim');
  const cartItems = $('#cartItems');
  let lastFocus = null;

  function addToCart(id, n) {
    const qty = (cart.get(id) || 0) + n;
    if (qty <= 0) cart.delete(id); else cart.set(id, qty);
    store.set('ns4-cart', Object.fromEntries(cart));
    updateCounts();
    renderCart();
    $$(`.product[data-id="${id}"] .product__add`).forEach((btn) => {
      btn.classList.toggle('is-added', cart.has(id));
      btn.innerHTML = cart.has(id) ? `${icon('i-check')} <span>Στο καλάθι (${cart.get(id)})</span>` : `${icon('i-cart')} <span>Στο καλάθι</span>`;
    });
    if (n > 0) { bump($('#cartBtn')); bump($('#dockCart')); }
  }

  function updateCounts() {
    const n = [...cart.values()].reduce((a, b) => a + b, 0);
    [['#cartCount', n], ['#dockCount', n], ['#wishCount', favs.size]].forEach(([sel, v]) => {
      const el = $(sel);
      el.textContent = v;
      el.hidden = v === 0;
    });
    $('#cartBtn').setAttribute('aria-label', `Καλάθι, ${n} τεμάχια`);
    $('#wishBtn').setAttribute('aria-label', `Αγαπημένα, ${favs.size}`);
  }

  function renderCart() {
    let sum = 0;
    cartItems.innerHTML = [...cart.entries()].map(([id, n]) => {
      const p = PROD[id], c = TYPE[p.cat], line = priceOf(p) * n;
      sum += line;
      return `<li class="citem" data-id="${id}"><span class="citem__ic ${c.dark ? 'is-dark' : ''}" style="--c:${c.c}">${icon(c.icon)}</span>
        <div><b>${esc(p.name)}</b><small>${esc(p.pack)} · ${fmt(priceOf(p))}</small>
        <div class="qty"><button type="button" data-d="-1" aria-label="Μείωση">${icon('i-minus')}</button><output>${n}</output><button type="button" data-d="1" aria-label="Αύξηση">${icon('i-plus')}</button></div></div>
        <span class="citem__sum">${fmt(line)}</span></li>`;
    }).join('');
    $('#cartTotal').textContent = fmt(sum);
    cartEl.classList.toggle('has-items', cart.size > 0);
    $('#cartMode').innerHTML = isB2B() ? 'Βλέπεις <b>τιμές B2B</b> χονδρικής.' : 'Βλέπεις τιμές λιανικής. Είσαι επαγγελματίας; Γύρνα σε <b>B2B</b> για χαμηλότερες τιμές.';
    $('#checkout').disabled = cart.size === 0;
  }
  cartItems.addEventListener('click', (e) => {
    const b = e.target.closest('[data-d]');
    if (b) addToCart(b.closest('.citem').dataset.id, +b.dataset.d);
  });

  const openCart = () => {
    lastFocus = document.activeElement;
    renderCart();
    scrim.hidden = false;
    cartEl.classList.add('is-open');
    cartEl.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    setTimeout(() => cartEl.focus(), 50);
  };
  const closeCart = () => {
    if (!cartEl.classList.contains('is-open')) return;
    cartEl.classList.remove('is-open');
    cartEl.setAttribute('aria-hidden', 'true');
    scrim.hidden = true;
    document.body.classList.remove('is-locked');
    if (lastFocus) lastFocus.focus();
  };
  $('#cartBtn').addEventListener('click', openCart);
  $('#dockCart').addEventListener('click', openCart);
  $('.cart__close').addEventListener('click', closeCart);
  scrim.addEventListener('click', closeCart);
  $('#checkout').addEventListener('click', () => toast('Σχέδιο παρουσίασης: εδώ θα συνδεθεί η ολοκλήρωση του e-shop.'));

  $('#wishBtn').addEventListener('click', () => {
    if (!favs.size) { toast('Πάτα την ♥ σε ένα προϊόν για να το κρατήσεις.'); return; }
    showShop({ fav: true });
  });
  $('#dockSearch').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    setTimeout(() => q.focus(), reduceMotion ? 0 : 350);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeCart();
    setMega('');
  });

  /* ---------- αλλαγή Λιανική / B2B ---------- */
  document.addEventListener('ns:mode', () => {
    renderProducts();
    if (sv.shop && !view.hidden) renderSvProducts();
    renderCart();
    if (!sug.hidden) renderSuggest();
  });

  /* =========================================================
     ΦΟΡΜΑ B2B
     ========================================================= */
  const b2bForm = $('#b2bForm');
  const note = $('.b2b__form-note', b2bForm);
  $('#b2bType').innerHTML = GROUPS.map((g) => `<optgroup label="${esc(g.name)}">${SHOPS.filter((s) => s.group === g.id).map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</optgroup>`).join('')
    + '<optgroup label="Άλλο"><option value="arch">Αρχιτέκτονας / διακοσμητής</option><option value="other">Άλλο</option></optgroup>';
  // από σελίδα καταστήματος → προεπιλογή του τύπου στη φόρμα
  document.addEventListener('click', (e) => { if (e.target.closest('a[href="#b2b"]') && sv.shop && !view.hidden) $('#b2bType').value = sv.shop.id; });
  b2bForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let firstBad = null;
    $$('input', b2bForm).forEach((input) => {
      const ok = input.checkValidity() && input.value.trim() !== '';
      input.classList.toggle('is-invalid', !ok);
      input.setAttribute('aria-invalid', String(!ok));
      if (!ok && !firstBad) firstBad = input;
    });
    if (firstBad) {
      note.classList.remove('is-ok');
      note.textContent = firstBad.name === 'vat' ? 'Το ΑΦΜ πρέπει να έχει 9 ψηφία.' : 'Συμπλήρωσε όλα τα πεδία.';
      firstBad.focus();
      return;
    }
    const d = new FormData(b2bForm);
    const typeSel = $('#b2bType');
    const body = [
      `Επωνυμία: ${d.get('company')}`,
      `ΑΦΜ: ${d.get('vat')}`,
      `Email: ${d.get('email')}`,
      `Τηλέφωνο: ${d.get('phone')}`,
      `Τύπος καταστήματος: ${typeSel.options[typeSel.selectedIndex].text}`
    ].join('\n');
    // Χωρίς backend: ανοίγει το email του χρήστη με έτοιμη την αίτηση.
    window.location.href = `mailto:info@newsystem.gr?subject=${encodeURIComponent('Αίτηση B2B λογαριασμού')}&body=${encodeURIComponent(body)}`;
    note.classList.add('is-ok');
    note.textContent = 'Ευχαριστούμε! Θα επικοινωνήσουμε μαζί σου εντός 24 ωρών.';
    b2bForm.reset();
  });
  b2bForm.addEventListener('input', (e) => {
    if (e.target.classList.contains('is-invalid') && e.target.checkValidity()) {
      e.target.classList.remove('is-invalid');
      e.target.removeAttribute('aria-invalid');
    }
  });

  /* ---------- footer ---------- */
  $('#footShops').innerHTML = SHOPS.map((s) => `<li><a href="#katastima/${s.id}">${esc(s.name)}</a></li>`).join('');
  $('#footCats').innerHTML = TYPES.map((t) => `<li><a href="#proionta" data-show-cat="${t.id}">${esc(t.name)}</a></li>`).join('');
  // στο κινητό οι στήλες του footer ξεκινούν κλειστές
  if (window.matchMedia('(max-width: 639px)').matches) $$('.fcol').forEach((d) => { d.open = false; });
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  renderProducts();
  renderCart();
  updateCounts();
  route();
})();
