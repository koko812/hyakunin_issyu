const speak = (text) => {
    // こういう API の呼び出しを脳死で書くのではなくて，構造(?)を意識しながら，かけるようになりたい
    const utterance = new SpeechSynthesisUtterance(text)
    // 私の場合，デフォルトではゆっくりっぽい日本語だった
    // ずんだもんに喋らせてみたい

    // これを指定するだけで英語も喋ってくれるんだが，voice のしていはひつようなんだろうか？？
    // 多分その言語のデフォルトが指定されるので，声を変えたい時は便利なのか
    const voices = speechSynthesis.getVoices()
    const en_voices = voices.filter(voice => voice.lang === 'en-US')
    // 日本語音声は１，2種類しかないみたい，英語は少なくとも 5つはあるんだが
    // やっぱりずんだもんを導入するのがいいかもしれない
    const jp_voices = voices.filter(voice => voice.lang === ('jp-JP' || 'ja-JP'))
    for (const voice of voices) {
        // なんかロードが遅くて表示されてないので，書くところを工夫したほうがいいかもしれないな
        // 別 javascript に書くのもちょっと考えたけど，受け渡しがよくわからんのでパス
        console.log(voice.name, voice.lang);
    }
    //console.log(voices, en_voices);
    console.log(voices, jp_voices);

    utterance.lang = "jp-JP"
    utterance.voice = jp_voices[0]
    speechSynthesis.speak(utterance)
}

const sleep = (duration) => new Promise(r => setTimeout(r, duration))

const cardWidth = 75
const cardHeight = 100
const col = 4
const row = 3
// これやっぱり，基本情報はここにまとめておいた方がいいよね
const poemNumber = 12

// poemString の加工が必要になる（init) に入れればいいか？？
// 音声のロードも init に入れればどうにかなる説ある？同じような気がしなくもないが
const poemList = []
let solutionList = []
const init = async () => {
    for (const poemLine of poemString.split('\n')) {
        // 配列操作がよくわからなくてつらい
        // 三個目までとそれ以降で分割して保存したいだけなんや
        const poemChunks = poemLine.split('　')
        const speechText = poemChunks.join('，')
        // 切り出しは slice, join は python とほぼ同じ，覚えておけ！！
        const lowText = poemChunks.slice(3, 5).join('')
        //console.log(poemChunks);
        //console.log(speechText);
        //console.log(lowText);
        poemList.push({ speechText, lowText })
    }
    // 変数そのまま辞書に代入したら，勝手に辞書形式になってくれて便利
    //console.log(poemList[0]);

    // 俳句の順番シャッフル
    for (let i = 0; i < poemList.length - 1; i++) {
        const index = Math.trunc(Math.random() * (poemList.length - i)) + i
        //[poemList[i], poemList[index]] =[poemList[index], poemList[i]]
        // この書き方はなんかダメだとコンパイラに言われる (t-kihiraのやり方)
        const bufPoem = poemList[i]
        poemList[i] = poemList[index]
        poemList[index] = bufPoem
    }

    // なんかもうこの辺で id 指定ミスとかないか知らせて欲しいよね，結構よくやるので
    // まあ先にこっちで決め打ち id した時に若干ウザいかもしれないけど
    const container = document.getElementById('container')
    for (let i = 0; i < poemNumber; i++) {
        const div = document.createElement('div')
        container.appendChild(div)
        div.style.position = `absolute`
        // また px をつけ忘れていた
        div.style.width = `${cardWidth - 2}px`
        div.style.height = `${cardHeight - 2}px`
        div.style.left = `${cardWidth * Math.trunc(i % col)}px`
        div.style.top = `${cardHeight * Math.trunc(i / col)}px`
        div.style.display = 'flex'
        div.style.alignItems = 'center'
        div.style.border = `solid 2px #0c6`
        div.style.boxSizing = `border-box`
        div.style.fontFamily = 'serif'
        div.style.writingMode = 'vertical-rl'
        div.style.fontSize = '18px'
        div.style.lineHeight = '23px'
        div.textContent = poemList[i].lowText
        poemList[i].element = div
        // これは, poemList 自体はすでに辞書として定義されてるので，.element でも問題なく代入できる
        solutionList.push(poemList[i])
        div.onpointerdown = (e) => {
            // この ifを入れとかないと，resolver の中身が定義される前に呼び出されて，エラーを吐かれる
            if (resolver) {
                resolver(poemList[i])
            }
        }
    }

    for (let i = 0; i < solutionList.length - 1; i++) {
        const index = Math.trunc(Math.random() * (solutionList.length - i)) + i
        const bufPoem = solutionList[i]
        solutionList[i] = solutionList[index]
        solutionList[index] = bufPoem
    }
}

// この resolver の挙動を心の底から理解できていないのが気持ち悪い
// この resolver の引数に何かを入れたら，その resolver の呼び出し元に何かが入って
// そこからその後の処理に進むというのはわかってるんだけど
let resolver = null
window.onload = async () => {
    init()
    document.getElementById('start').onclick = async (e) => {
        const message = document.getElementById('message')
        message.innerHTML = 'スタート！！'
        speak('はじまります')
        let cnt = 0;
        while (solutionList.length) {
            if (cnt > 0) {
                speak('もういっしゅう，よませていただきます')
                await sleep(2000)
            }
            for (solution of solutionList) {
                await sleep(2000)
                speak(solution.speechText)
                message.innerHTML = ''
                const answer = await new Promise(resolve => {
                    resolver = resolve
                })
                if (speechSynthesis.speaking) {
                    speechSynthesis.cancel()
                }
                if (answer === solution) {
                    message.innerHTML = '正解！'
                    solution.element.style.display = 'none'
                    solution.isAnsewered = true
                } else {
                    // これお手つきに入ったら２度と戻れなさそうなのが困るよね
                    // そんなことはなかった
                    message.innerHTML = 'お手つき！'
                }
            }
            solutionList = solutionList.filter(v => !v.isAnsewered)
            console.log(solutionList);
            cnt++;
            await sleep(1000)
        }
        speak('すばらしいカルタさばきでした。おつかれさまです')
        message.innerHTML = 'おしまい！'
    }
}


const poemString = `あきのたの　かりほのいほの　とまをあらみ　わがころもでは　つゆにぬれつつ
はるすぎて　なつきにけらし　しろたへの　ころもほすてふ　あまのかぐやま	
あしびきの　やまどりのをの　しだりをの　ながながしよを　ひとりかもねむ	
たごのうらに　うちいでてみれば　しろたへの　ふじのたかねに　ゆきはふりつつ	
おくやまに　もみぢふみわけ　なくしかの　こゑきくときぞ　あきはかなしき	
かささぎの　わたせるはしに　おくしもの　しろきをみれば　よぞふけにける	
あまのはら　ふりさけみれば　かすがなる　みかさのやまに　いでしつきかも	
わがいほは　みやこのたつみ　しかぞすむ　よをうぢやまと　ひとはいふなり	
はなのいろは　うつりにけりな　いたづらに　わがみよにふる　ながめせしまに	
これやこの　ゆくもかへるも　わかれては　しるもしらぬも　あふさかのせき	
わたのはら　やそしまかけて　こぎいでぬと　ひとにはつげよ　あまのつりぶね	
あまつかぜ　くものかよひぢ　ふきとぢよ　をとめのすがた　しばしとどめむ	
つくばねの　みねよりおつる　みなのがは　こひぞつもりて　ふちとなりぬる	
みちのくの　しのぶもぢずり　たれゆゑに　みだれそめにし　われならなくに	
きみがため　はるののにいでて　わかなつむ　わがころもでに　ゆきはふりつつ	
たちわかれ　いなばのやまの　みねにおふる　まつとしきかば　いまかへりこむ	
ちはやぶる　かみよもきかず　たつたがは　からくれなゐに　みづくくるとは	
すみのえの　きしによるなみ　よるさへや　ゆめのかよひぢ　ひとめよくらむ	
なにはがた　みじかきあしの　ふしのまも　あはでこのよを　すぐしてよとや	
わびぬれば　いまはたおなじ　なにはなる　みをつくしても　あはむとぞおもふ	
いまこむと　いひしばかりに　ながつきの　ありあけのつきを　まちでつるかな	
ふくからに　あきのくさきの　しをるれば　むべやまかぜを　あらしといふらむ	
つきみれば　ちぢにものこそ　かなしけれ　わがみひとつの　あきにはあらねど	
このたびは　ぬさもとりあへず　たむけやま　もみぢのにしき　かみのまにまに	
なにしおはば　あふさかやまの　さねかづら　ひとにしられで　くるよしもがな	
をぐらやま　みねのもみぢば　こころあらば　いまひとたびの　みゆきまたなむ	
みかのはら　わきてながるる　いづみがは　いつみきとてか　こひしかるらむ	
やまざとは　ふゆぞさびしさ　まさりける　ひとめもくさも　かれぬとおもへば	
こころあてに　をらばやをらむ　はつしもの　おきまどはせる　しらぎくのはな	
ありあけの　つれなくみえし　わかれより　あかつきばかり　うきものはなし	
あさぼらけ　ありあけのつきと　みるまでに　よしののさとに　ふれるしらゆき	
やまがはに　かぜのかけたる　しがらみは　ながれもあへぬ　もみぢなりけり	
ひさかたの　ひかりのどけき　はるのひに　しづごころなく　はなのちるらむ	
たれをかも　しるひとにせむ　たかさごの　まつもむかしの　ともならなくに	
ひとはいさ　こころもしらず　ふるさとは　はなぞむかしの　かににほひける	
なつのよは　まだよひながら　あけぬるを　くものいづこに　つきやどるらむ	
しらつゆに　かぜのふきしく　あきののは　つらぬきとめぬ　たまぞちりける	
わすらるる　みをばおもはず　ちかひてし　ひとのいのちの　をしくもあるかな	
あさぢふの　をののしのはら　しのぶれど　あまりてなどか　ひとのこひしき	
しのぶれど　いろにいでにけり　わがこひは　ものやおもふと　ひとのとふまで	
こひすてふ　わがなはまだき　たちにけり　ひとしれずこそ　おもひそめしか	
ちぎりきな　かたみにそでを　しぼりつつ　すゑのまつやま　なみこさじとは	
あひみての　のちのこころに　くらぶれば　むかしはものを　おもはざりけり	
あふことの　たえてしなくは　なかなかに　ひとをもみをも　うらみざらまし	
あはれとも　いふべきひとは　おもほえで　みのいたづらに　なりぬべきかな	
ゆらのとを　わたるふなびと　かぢをたえ　ゆくへもしらぬ　こひのみちかな	
やへむぐら　しげれるやどの　さびしきに　ひとこそみえね　あきはきにけり	
かぜをいたみ　いはうつなみの　おのれのみ　くだけてものを　おもふころかな	
みかきもり　ゑじのたくひの　よるはもえ　ひるはきえつつ　ものをこそおもへ	
きみがため　をしからざりし　いのちさへ　ながくもがなと　おもひけるかな	
かくとだに　えやはいぶきの　さしもぐさ　さしもしらじな　もゆるおもひを	
あけぬれば　くるるものとは　しりながら　なほうらめしき　あさぼらけかな	
なげきつつ　ひとりぬるよの　あくるまは　いかにひさしき　ものとかはしる	
わすれじの　ゆくすゑまでは　かたければ　けふをかぎりの　いのちともがな	
たきのおとは　たえてひさしく　なりぬれど　なこそながれて　なほきこえけれ	
あらざらむ　このよのほかの　おもひでに　いまひとたびの　あふこともがな	
めぐりあひて　みしやそれとも　わかぬまに　くもがくれにし　よはのつきかな	
ありまやま　ゐなのささはら　かぜふけば　いでそよひとを　わすれやはする	
やすらはで　ねなましものを　さよふけて　かたぶくまでの　つきをみしかな	
おほえやま　いくののみちの　とほければ　まだふみもみず　あまのはしだて	
いにしへの　ならのみやこの　やへざくら　けふここのへに　にほひぬるかな	
よをこめて　とりのそらねは　はかるとも　よにあふさかの　せきはゆるさじ	
いまはただ　おもひたえなむ　とばかりを　ひとづてならで　いふよしもがな	
あさぼらけ　うぢのかはぎり　たえだえに　あらはれわたる　せぜのあじろぎ	
うらみわび　ほさぬそでだに　あるものを　こひにくちなむ　なこそをしけれ	
もろともに　あはれとおもへ　やまざくら　はなよりほかに　しるひともなし	
はるのよの　ゆめばかりなる　たまくらに　かひなくたたむ　なこそをしけれ	
こころにも　あらでうきよに　ながらへば　こひしかるべき　よはのつきかな	
あらしふく　みむろのやまの　もみぢばは　たつたのかはの　にしきなりけり	
さびしさに　やどをたちいでて　ながむれば　いづこもおなじ　あきのゆふぐれ	
ゆふされば　かどたのいなば　おとづれて　あしのまろやに　あきかぜぞふく	
おとにきく　たかしのはまの　あだなみは　かけじやそでの　ぬれもこそすれ	
たかさごの　をのへのさくら　さきにけり　とやまのかすみ　たたずもあらなむ	
うかりける　ひとをはつせの　やまおろしよ　はげしかれとは　いのらぬものを	
ちぎりおきし　させもがつゆを　いのちにて　あはれことしの　あきもいぬめり	
わたのはら　こぎいでてみれば　ひさかたの　くもゐにまがふ　おきつしらなみ	
せをはやみ　いはにせかるる　たきがはの　われてもすゑに　あはむとぞおもふ	
あはぢしま　かよふちどりの　なくこゑに　いくよねざめぬ　すまのせきもり	
あきかぜに　たなびくくもの　たえまより　もれいづるつきの　かげのさやけさ	
ながからむ　こころもしらず　くろかみの　みだれてけさは　ものをこそおもへ	
ほととぎす　なきつるかたを　ながむれば　ただありあけの　つきぞのこれる	
おもひわび　さてもいのちは　あるものを　うきにたへぬは　なみだなりけり	
よのなかよ　みちこそなけれ　おもひいる　やまのおくにも　しかぞなくなる	
ながらへば　またこのごろや　しのばれむ　うしとみしよぞ　いまはこひしき	
よもすがら　ものおもふころは　あけやらで　ねやのひまさへ　つれなかりけり	
なげけとて　つきやはものを　おもはする　かこちがほなる　わがなみだかな	
むらさめの　つゆもまだひぬ　まきのはに　きりたちのぼる　あきのゆふぐれ	
なにはえの　あしのかりねの　ひとよゆゑ　みをつくしてや　こひわたるべき	
たまのをよ　たえなばたえね　ながらへば　しのぶることの　よわりもぞする	
みせばやな　をじまのあまの　そでだにも　ぬれにぞぬれし　いろはかはらず	
きりぎりす　なくやしもよの　さむしろに　ころもかたしき　ひとりかもねむ	
わがそでは　しほひにみえぬ　おきのいしの　ひとこそしらね　かわくまもなし	
よのなかは　つねにもがもな　なぎさこぐ　あまのをぶねの　つなでかなしも	
みよしのの　やまのあきかぜ　さよふけて　ふるさとさむく　ころもうつなり	
おほけなく　うきよのたみに　おほふかな　わがたつそまに　すみぞめのそで	
はなさそふ　あらしのにはの　ゆきならで　ふりゆくものは　わがみなりけり	
こぬひとを　まつほのうらの　ゆふなぎに　やくやもしほの　みもこがれつつ	
かぜそよぐ　ならのをがはの　ゆふぐれは　みそぎぞなつの　しるしなりける	
ひともをし　ひともうらめし　あぢきなく　よをおもふゆゑに　ものおもふみは	
ももしきや　ふるきのきばの　しのぶにも　なほあまりある　むかしなりけり	
`