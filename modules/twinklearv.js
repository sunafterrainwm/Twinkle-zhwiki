// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklearv.js: ARV module
 ****************************************
 * Mode of invocation:     Tab ("ARV")
 * Active on:              Any page with relevant user name (userspace, contribs, etc.)
 */

Twinkle.arv = function twinklearv() {
	var username = Morebits.wiki.flow.relevantUserName(true);
	if (!username) {
		return;
	}

	var isIP = mw.util.isIPAddress(username);
	var title = isIP ? wgULS('报告IP给管理员', '報告IP給管理員') : wgULS('报告用户给管理人员', '報告使用者給管理人員');

	Twinkle.addPortletLink(function() {
		Twinkle.arv.callback(username, isIP);
	}, wgULS('告状', '告狀'), 'tw-arv', title);
};

Twinkle.arv.callback = function (uid, isIP) {
	if (uid === mw.config.get('wgUserName')) {
		alert(wgULS('你不想报告你自己，对吧？', '你不想報告你自己，對吧？'));
		return;
	}

	var Window = new Morebits.simpleWindow(600, 500);
	Window.setTitle(wgULS('报告用户给管理人员', '報告使用者給管理人員'));
	Window.setScriptName('Twinkle');
	Window.addFooterLink('VIP', 'WP:VIP');
	Window.addFooterLink('EWIP', 'WP:EWIP');
	Window.addFooterLink('UAA', 'WP:UAA');
	Window.addFooterLink(wgULS('用户名方针', '使用者名稱方針'), 'WP:U');
	Window.addFooterLink('SPI', 'WP:SPI');
	Window.addFooterLink(wgULS('告状设置', '告狀設定'), 'WP:TW/PREF#arv');
	Window.addFooterLink(wgULS('Twinkle帮助', 'Twinkle說明'), 'H:TW#告狀');

	var form = new Morebits.quickForm(Twinkle.arv.callback.evaluate);
	var categories = form.append({
		type: 'select',
		name: 'category',
		label: wgULS('选择报告类型：', '選擇報告類別：'),
		event: Twinkle.arv.callback.changeCategory
	});
	categories.append({
		type: 'option',
		label: wgULS('破坏（WP:VIP）', '破壞（WP:VIP）'),
		value: 'aiv'
	});
	categories.append({
		type: 'option',
		label: wgULS('编辑争议（WP:EWIP）', '編輯爭議（WP:EWIP）'),
		value: 'ewip'
	});
	categories.append({
		type: 'option',
		label: wgULS('用户名（WP:UAA）', '使用者名稱（WP:UAA）'),
		value: 'username',
		disabled: mw.util.isIPAddress(uid)
	});
	categories.append({
		type: 'option',
		label: wgULS('傀儡调查（WP:SPI）', '傀儡調查（WP:SPI）'),
		value: 'spi'
	});
	form.append({
		type: 'div',
		label: '',
		style: 'color: red',
		id: 'twinkle-arv-blockwarning'
	});

	form.append({
		type: 'field',
		label: 'Work area',
		name: 'work_area'
	});
	form.append({ type: 'submit', label: '提交' });
	form.append({
		type: 'hidden',
		name: 'uid',
		value: uid
	});

	var result = form.render();
	Window.setContent(result);
	Window.display();

	// Check if the user is blocked, update notice
	var query = {
		action: 'query',
		list: 'blocks',
		bkprop: 'range|flags',
		format: 'json'
	};
	if (isIP) {
		query.bkip = uid;
	} else {
		query.bkusers = uid;
	}
	new Morebits.wiki.api(wgULS('检查用户的封禁状态', '檢查使用者的封鎖狀態'), query, function(apiobj) {
		var blocklist = apiobj.getResponse().query.blocks;
		if (blocklist.length) {
			var block = blocklist[0];
			var message = (isIP ? wgULS('此IP地址', '此IP位址') : wgULS('此账户', '此帳號')) + wgULS('已经被', '已經被') + (block.partial ? '部分' : '');
			// Start and end differ, range blocked
			message += block.rangestart !== block.rangeend ? wgULS('段封禁。', '段封鎖。') : wgULS('封禁。', '封鎖。');
			if (block.partial) {
				$('#twinkle-arv-blockwarning').css('color', 'black'); // Less severe
			}
			$('#twinkle-arv-blockwarning').text(message);
		}
	}).post();


	// We must init the
	var evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.category.dispatchEvent(evt);
};

Twinkle.arv.lta_list = [
	{ value: '', label: wgULS('请选择', '請選擇') },
	{ value: 'Adam Asrul', label: 'Adam Asrul、ADAM' },
	{ value: 'Albert20009', label: 'Albert20009' },
	{ value: 'Kapol6360', label: 'Kapol6360、Kapol' },
	{ value: 'R1t5', label: wgULS('114.27、数论和人瑞类条目破坏、R1t5', '114.27、數論和人瑞類條目破壞、R1t5') },
	{ value: 'Royalfanta', label: 'Royalfanta、RF' },
	{ value: 'Xayahrainie43', label: 'Xayahrainie43、X43、妍欣' },
	{ value: '米記123', label: '米記123' }
];

Twinkle.arv.callback.pick_lta = function twinklearvCallbackPickLta(e) {
	e.target.form.sockmaster.value = e.target.value;
	Twinkle.arv.callback.spi_notice(e.target.form, e.target.value);
	Twinkle.arv.callback.set_sockmaster(e.target.value);
	e.target.value = '';
};

Twinkle.arv.callback.sockmaster_changed = function twinklearvCallbackSockmasterChanged(e) {
	Twinkle.arv.callback.spi_notice(e.target.form, e.target.value);
	Twinkle.arv.callback.set_sockmaster(e.target.value);
};

Twinkle.arv.callback.spi_notice = function twinklearvCallbackSpiNotice(form, sockmaster) {
	var previewText = '{{#ifexist:Wikipedia:傀儡調查/案件/' + sockmaster +
		'|{{#ifexist:Wikipedia:傀儡調查/案件通告/' + sockmaster +
		'  |<div class="extendedconfirmed-show sysop-show">{{Memo|1={{Wikipedia:傀儡調查/案件通告/' + sockmaster + '}}|2=notice}}</div>' +
		'  |無案件通告}}' +
		'|您將建立新的提報頁面，如果您希望提報過往曾被提報過的使用者，請檢查您的輸入是否正確。}}';
	form.spinoticepreviewer.beginRender(previewText, 'Wikipedia:傀儡調查/案件/' + sockmaster);
};

Twinkle.arv.callback.set_sockmaster = function twinklearvCallbackSetSockmaster(sockmaster) {
	$('code.tw-arv-sockmaster').text('{{subst:Socksuspectnotice|1=' + sockmaster + '}}');
};

Twinkle.arv.callback.changeCategory = function (e) {
	var value = e.target.value;
	var root = e.target.form;
	var old_area = Morebits.quickForm.getElements(root, 'work_area')[0];
	var work_area = null;
	var previewlink = document.createElement('a');
	previewlink.style.cursor = 'pointer';
	previewlink.textContent = wgULS('预览', '預覽');
	$(previewlink).on('click', function() {
		Twinkle.arv.callback.preview(root);
	});

	switch (value) {
		case 'aiv':
		/* falls through */
		default:
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: wgULS('报告用户破坏', '報告使用者破壞'),
				name: 'work_area'
			});
			work_area.append({
				type: 'div',
				label: wgULS('提报傀儡应优先发送至傀儡调查，除非相关的账户有高频率、涉及多个页面等紧急严重的破坏行为。', '提報傀儡應優先發送至傀儡調查，除非相關的帳號有高頻率、涉及多個頁面等緊急嚴重的破壞行為。')
			});
			work_area.append({
				type: 'input',
				name: 'page',
				label: wgULS('相关页面：', '相關頁面：'),
				tooltip: wgULS('如不希望让报告链接到页面，请留空', '如不希望讓報告連結到頁面，請留空'),
				value: mw.util.getParamValue('vanarticle') || '',
				event: function(e) {
					var value = e.target.value;
					var root = e.target.form;
					if (value === '') {
						root.badid.disabled = root.goodid.disabled = true;
					} else {
						root.badid.disabled = false;
						root.goodid.disabled = root.badid.value === '';
					}
				}
			});
			work_area.append({
				type: 'input',
				name: 'badid',
				label: wgULS('受到破坏的修订版本：', '受到破壞的修訂版本：'),
				tooltip: wgULS('留空以略过差异', '留空以略過差異'),
				value: mw.util.getParamValue('vanarticlerevid') || '',
				disabled: !mw.util.getParamValue('vanarticle'),
				event: function(e) {
					var value = e.target.value;
					var root = e.target.form;
					root.goodid.disabled = value === '';
				}
			});
			work_area.append({
				type: 'input',
				name: 'goodid',
				label: wgULS('破坏前的修订版本：', '破壞前的修訂版本：'),
				tooltip: wgULS('留空以略过差异的较早版本', '留空以略過差異的較早版本'),
				value: mw.util.getParamValue('vanarticlegoodrevid') || '',
				disabled: !mw.util.getParamValue('vanarticle') || mw.util.getParamValue('vanarticlerevid')
			});
			work_area.append({
				type: 'checkbox',
				name: 'arvtype',
				list: [
					{
						label: wgULS('已发出最后（层级4或4im）警告', '已發出最後（層級4或4im）警告'),
						value: 'final'
					},
					{
						label: wgULS('封禁过期后随即破坏', '封鎖過期後隨即破壞'),
						value: 'postblock'
					},
					{
						label: wgULS('显而易见的纯破坏用户', '顯而易見的純破壞使用者'),
						value: 'vandalonly',
						disabled: mw.util.isIPAddress(root.uid.value)
					},
					{
						label: wgULS('显而易见的spambot或失窃账户', '顯而易見的spambot或失竊帳號'),
						value: 'spambot'
					},
					{
						label: wgULS('仅用来散发广告宣传的用户', '僅用來散發廣告宣傳的使用者'),
						value: 'promoonly',
						disabled: mw.util.isIPAddress(root.uid.value)
					}
				]
			});
			if (!mw.util.isIPAddress(Morebits.wiki.flow.relevantUserName(true))) {
				work_area.append({
					type: 'checkbox',
					list: [
						{
							label: wgULS('在页面上及编辑摘要隐藏用户名', '在頁面上及編輯摘要隱藏使用者名稱'),
							tooltip: wgULS('若用户名不当请勾选此项，注意：请考虑私下联系管理员处理。', '若使用者名稱不當請勾選此項，注意：請考慮私下聯絡管理員處理。'),
							name: 'hidename',
							value: 'hidename'
						}
					]
				});
			}
			work_area.append({
				type: 'textarea',
				name: 'reason',
				label: wgULS('评论：', '評論：')
			});
			work_area.append({ type: 'div', id: 'arvpreview', label: [ previewlink ] });
			work_area.append({ type: 'div', id: 'twinklearv-previewbox', style: 'display: none' });
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
		case 'ewip':
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: wgULS('报告编辑争议', '報告編輯爭議'),
				name: 'work_area'
			});
			work_area.append(
				{
					type: 'dyninput',
					name: 'page',
					label: wgULS('相关页面：', '相關頁面：'),
					sublabel: wgULS('页面：', '頁面：'),
					tooltip: wgULS('如不希望让报告链接到页面，请留空', '如不希望讓報告連結到頁面，請留空'),
					min: 1,
					max: 10
				});
			work_area.append({
				type: 'textarea',
				name: 'reason',
				label: wgULS('评论：', '評論：')
			});
			work_area.append({ type: 'div', id: 'arvpreview', label: [ previewlink ] });
			work_area.append({ type: 'div', id: 'twinklearv-previewbox', style: 'display: none' });
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
		case 'username':
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: wgULS('报告不当用户名', '報告不當使用者名稱'),
				name: 'work_area'
			});
			work_area.append({
				type: 'header',
				label: wgULS('不当用户名类型', '不當使用者名稱類別'),
				tooltip: wgULS('维基百科不允许使用带有误导性、宣传性、侮辱性或破坏性的用户名。此外，使用域名及邮箱地址的用户名亦被禁止。这些准则俱应应用至用户名及签名。在其他语言中不当的用户名或通过错拼、替代、暗示、拆字或任何间接方法达成的非妥当用户名同样视为违规。',
					'維基百科不允許使用帶有誤導性、宣傳性、侮辱性或破壞性的使用者名稱。此外，使用域名及電子信箱位址的使用者名稱亦被禁止。這些準則俱應應用至使用者名稱及簽名。在其他語言中不當的使用者名稱或通過錯拼、替代、暗示、拆字或任何間接方法達成的非妥當使用者名稱同樣視為違規。')
			});
			work_area.append({
				type: 'checkbox',
				name: 'arvtype',
				list: [
					{
						label: wgULS('误导性用户名', '誤導性使用者名稱'),
						value: wgULS('误导性', '誤導性'),
						tooltip: wgULS('误导性用户名隐含着与贡献者相关或误导他人的事情。例如︰不实观点、暗示账户拥有特定权限或暗示该账户并非由一人拥有而是由一个组群、一个项目或一个集体运作。',
							'誤導性使用者名稱隱含著與貢獻者相關或誤導他人的事情。例如︰不實觀點、暗示帳戶擁有特定權限或暗示該帳戶並非由一人擁有而是由一個群組、一個計畫或一個集體運作。')
					},
					{
						label: wgULS('宣传性用户名', '宣傳性使用者名稱'),
						value: wgULS('宣传性', '宣傳性'),
						tooltip: wgULS('宣传性用户名会于维基百科上起推销一个组群或一间公司的作用。', '宣傳性使用者名稱會於維基百科上起推銷一個群組或一間公司的作用。')
					},
					{
						label: wgULS('暗示并非由一人拥有', '暗示並非由一人擁有'),
						value: 'shared',
						tooltip: wgULS('每个维基账户只可以代表个人（容许一些例外情况），所有与他人分享账户的行为（包括分享账户密码）均被禁止。', '每個維基帳戶只可以代表個人（容許一些例外情況），所有與他人分享帳戶的行為（包括分享帳戶密碼）均被禁止。')
					},
					{
						label: wgULS('侮辱性用户名', '侮辱性使用者名稱'),
						value: '侮辱性',
						tooltip: wgULS('侮辱性用户名令协调编辑变得困难，甚至无可能。', '侮辱性使用者名稱令協調編輯變得困難，甚至無可能。')
					},
					{
						label: wgULS('破坏性用户名', '破壞性使用者名稱'),
						value: wgULS('破坏性', '破壞性'),
						tooltip: wgULS('破坏性用户名包括人身攻击、伪冒他人或其他一切有着清晰可见的破坏维基百科意图的用户名。', '破壞性使用者名稱包括人身攻擊、偽冒他人或其他一切有著清晰可見的破壞維基百科意圖的使用者名稱。')
					}
				]
			});
			work_area.append({
				type: 'checkbox',
				list: [
					{
						label: wgULS('在页面上隐藏用户名（需监督的用户名请勿于站内报告，勾选此项并不构成能在站内报告的理由）', '在頁面上隱藏使用者名稱（需監督的使用者名稱請勿於站內報告，勾選此項並不構成能在站內報告的理由）'),
						tooltip: wgULS('若用户名不当请勾选此项，注意：请考虑私下联系管理员处理。', '若使用者名稱不當請勾選此項，注意：請考慮私下聯絡管理員處理。'),
						name: 'hidename',
						value: 'hidename'
					}
				],
				style: 'font-weight: bold;'
			});
			work_area.append({
				type: 'textarea',
				name: 'reason',
				label: wgULS('评论：', '評論：')
			});
			work_area.append({ type: 'div', id: 'arvpreview', label: [ previewlink ] });
			work_area.append({ type: 'div', id: 'twinklearv-previewbox', style: 'display: none' });
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;

		case 'spi':
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: wgULS('发起傀儡调查', '發起傀儡調查'),
				name: 'work_area'
			});
			work_area.append({
				type: 'select',
				name: 'common_lta',
				label: '持續出沒的破壞者：',
				style: 'width: 420px;',
				list: Twinkle.arv.lta_list,
				event: Twinkle.arv.callback.pick_lta
			});
			work_area.append({
				type: 'input',
				name: 'sockmaster',
				label: $('<a>', {
					href: mw.util.getUrl('Special:PrefixIndex/Wikipedia:傀儡調查/案件/'),
					text: 'Wikipedia:傀儡調查/案件/',
					target: '_blank'
				})[0],
				tooltip: wgULS('主账户的用户名（不含User:前缀），这被用于创建傀儡调查子页面的标题，可在 Wikipedia:傀儡调查/案件 的子页面搜索先前的调查。', '主帳號的使用者名稱（不含User:字首），這被用於建立傀儡調查子頁面的標題，可在 Wikipedia:傀儡調查/案件 的子頁面搜尋先前的調查。'),
				value: root.uid.value,
				event: Twinkle.arv.callback.sockmaster_changed
			});
			work_area.append({ type: 'div', id: 'twinklearv-spinoticebox', style: 'display: none' });
			work_area.append({
				type: 'dyninput',
				name: 'sockpuppet',
				label: '傀儡',
				sublabel: '傀儡：',
				tooltip: wgULS('傀儡的用户名（不含User:前缀）', '傀儡的使用者名稱（不含User:字首）'),
				min: 2,
				max: 9
			});
			work_area.append({
				type: 'textarea',
				label: wgULS('证据：', '證據：'),
				name: 'reason',
				tooltip: wgULS('输入能够用来体现这些用户可能滥用多重账户的证据，这通常包括互助客栈发言、页面历史或其他有关的信息。请避免在此处提供非与傀儡或滥用多重账户相关的其他讨论。', '輸入能夠用來體現這些使用者可能濫用多重帳號的證據，這通常包括互助客棧發言、頁面歷史或其他有關的資訊。請避免在此處提供非與傀儡或濫用多重帳號相關的其他討論。')
			});
			work_area.append({
				type: 'checkbox',
				list: [{
					label: wgULS('请求用户查核', '請求使用者查核'),
					name: 'checkuser',
					tooltip: wgULS('用户查核是一种用于获取傀儡指控相关技术证据的工具，若没有正当理由则不会使用，您必须在证据字段充分解释为什么需要使用该工具。用户查核不会用于公开连接用户账户使用的IP地址。', '使用者查核是一種用於獲取傀儡指控相關技術證據的工具，若沒有正當理由則不會使用，您必須在證據欄位充分解釋為什麼需要使用該工具。使用者查核不會用於公開連接使用者帳號使用的IP位址。')
				}]
			});
			work_area.append({ type: 'div', id: 'arvpreview', label: [ previewlink ] });
			work_area.append({ type: 'div', id: 'twinklearv-previewbox', style: 'display: none' });
			work_area.append({
				type: 'div',
				label: [
					wgULS('请使用常识决定是否以', '請使用常識決定是否以'),
					$('<code>').addClass('tw-arv-sockmaster').attr('style', 'margin: 2px;')[0],
					wgULS('通知用户。这不是必须的，对于涉及新用户的报告而言，通知他们能让报告显得更公平，但是许多情况下（如长期破坏者）通知更可能适得其反。', '通知使用者。這不是必須的，對於涉及新使用者的報告而言，通知他們能讓報告顯得更公平，但是許多情況下（如長期破壞者）通知更可能適得其反。')
				]
			});
			work_area = work_area.render();
			$('input:text[name=sockpuppet]', work_area).first().val(root.uid.value);
			old_area.parentNode.replaceChild(work_area, old_area);
			root.spinoticepreviewer = new Morebits.wiki.preview($(work_area).find('#twinklearv-spinoticebox').last()[0]);
			Twinkle.arv.callback.spi_notice(root, root.uid.value);
			Twinkle.arv.callback.set_sockmaster(root.uid.value);
			break;
	}
	root.previewer = new Morebits.wiki.preview($(work_area).find('#twinklearv-previewbox').last()[0]);
};

Twinkle.arv.callback.preview = function(form) {
	var reason = Twinkle.arv.callback.getReportWikitext(form);
	if (reason === undefined) {
		return;
	}
	var input = Morebits.quickForm.getInputData(form);
	var title;
	switch (input.category) {
		case 'vip': title = 'Wikipedia:当前的破坏'; break;
		case 'ewip': title = 'Wikipedia:管理员布告板/编辑争议'; break;
		case 'username': title = 'Wikipedia:需要管理員注意的用戶名'; break;
		case 'spi': title = 'Wikipedia:傀儡調查/案件/' + input.sockmaster; break;
		default: title = mw.config.get('wgPageName'); break;
	}
	form.previewer.beginRender('__NOTOC__' + reason[0], title);
};

Twinkle.arv.callback.getReportWikitext = function(form) {
	var input = Morebits.quickForm.getInputData(form);
	var reason = '';
	var comment = '';
	var uid = input.uid;

	var checkTitle = function(title, revid) {
		if (/https?:\/\//.test(title)) {
			alert(wgULS('页面名称不能使用网址。', '頁面名稱不能使用網址。'));
			return false;
		}

		var page;
		try {
			page = new mw.Title(title);
		} catch (error) {
			alert(wgULS('“', '「') + title + wgULS('”不是一个有效的页面名称，如要使用差异链接请放在“评论”', '」不是一個有效的頁面名稱，如要使用差異連結請放在「評論」') + (revid ? wgULS('，或正确输入“修订版本”', '，或正確輸入「修訂版本」') : '') + '。');
			return false;
		}

		if (page.namespace === -1) {
			alert(wgULS('“', '「') + title + wgULS('”属于特殊页面，如要使用差异链接请放在“评论”', '」屬於特殊頁面，如要使用差異連結請放在「評論」') + (revid ? wgULS('，或正确输入“修订版本”', '，或正確輸入「修訂版本」') : '') + '。');
			return false;
		}

		return page;
	};

	var page;
	switch (input.category) {
		// Report user for vandalism
		case 'aiv':
			/* falls through */
		default:
			if (!input.arvtype.length && input.reason === '') {
				alert(wgULS('您必须指定理由', '您必須指定理由'));
				return;
			}

			reason += '=== {{vandal|' + (/=/.test(uid) ? '1=' : '') + uid;
			if (input.hidename) {
				reason += '|hidename=1';
			}
			reason += '}} ===\n';

			var types = input.arvtype.map(function(v) {
				switch (v) {
					case 'final':
						return '已发出最后警告';
					case 'postblock':
						return '封禁过期后随即破坏';
					case 'spambot':
						return '显而易见的spambot或失窃账户';
					case 'vandalonly':
						return '显而易见的纯破坏用户';
					case 'promoonly':
						return '仅用来散发广告宣传的用户';
					default:
						return '未知理由';
				}
			}).join('，');

			if (input.page !== '') {
				page = checkTitle(input.page, true);
				if (!page) {
					return;
				}

				comment += '* {{pagelinks|' + (page.getPrefixedText().indexOf('=') > -1 ? '1=' : '') + page.getPrefixedText() + '}}';

				if (input.badid) {
					comment += '（{{diff|' + page.getPrefixedText() + '|' + input.badid + '|' + (input.goodid ? input.goodid : '') + '|diff}}）';
				}
				comment += '\n';
			}

			if (types) {
				comment += '* ' + types;
			}
			if (input.reason !== '') {
				input.reason = input.reason.replace(/\n\n+/g, '\n');
				input.reason = input.reason.replace(/\r?\n/g, '\n*:');  // indent newlines
				comment += (types ? '。' : '* ') + input.reason;
			}
			comment = comment.trim();
			comment = Morebits.string.appendPunctuation(comment);

			reason += comment + '\n* 发现人：~~~~\n* 处理：';
			break;

		// Report 3RR
		case 'ewip':
			if (input.reason === '') {
				alert(wgULS('您必须指定理由', '您必須指定理由'));
				return;
			}
			reason = '\n=== {{vandal|' + (/=/.test(uid) ? '1=' : '') + uid + '}} ===\n';

			var pages = $.map($('input:text[name=page]', form), function (o) {
				return $(o).val() || null;
			});
			for (var i = 0; i < pages.length; i++) {
				page = checkTitle(pages[i], false);
				if (!page) {
					return;
				}

				comment += '* {{pagelinks|' + (page.getPrefixedText().indexOf('=') > -1 ? '1=' : '') + page.getPrefixedText() + '}}\n';
			}
			input.reason = input.reason.replace(/\n\n+/g, '\n');
			input.reason = input.reason.replace(/\r?\n/g, '\n*:');  // indent newlines
			comment += '* ' + input.reason + '\n';
			comment = comment.trim();
			comment = Morebits.string.appendPunctuation(comment);

			reason += comment + '\n* 提報人：~~~~\n* 处理：';
			break;

		// Report inappropriate username
		case 'username':
			types = input.arvtype.map(Morebits.string.toLowerCaseFirstChar);

			var hasShared = types.indexOf('shared') > -1;
			if (hasShared) {
				types.splice(types.indexOf('shared'), 1);
			}

			if (types.indexOf('侮辱性') !== -1) {
				if (!confirm(wgULS('警告：严重的侮辱性用户名和针对特定个人的侮辱性用户名不应在公开页面报告，而是应当私下联系监督员处理。是否继续？',
					'警告：嚴重的侮辱性使用者名稱和針對特定個人的侮辱性使用者名稱不應在公開頁面報告，而是應當私下聯絡監督員處理。是否繼續？'))) {
					return;
				}
			}

			if (types.length <= 2) {
				types = types.join('和');
			} else {
				types = [ types.slice(0, -1).join('、'), types.slice(-1) ].join('和');
			}
			comment += '*{{user-uaa|1=' + uid;
			if (input.hidename) {
				comment += '|hidename=1';
			}
			comment += '}} &ndash; ';
			if (types.length) {
				comment += types + wgULS('用户名', '使用者名稱');
			}
			if (types.length && hasShared) {
				comment += '，';
			}
			if (hasShared) {
				comment += wgULS('暗示该账户并非由一人拥有', '暗示該帳號並非由一人擁有');
			}
			if (types.length || hasShared) {
				comment += '。';
			}
			if (input.reason) {
				comment += Morebits.string.toUpperCaseFirstChar(input.reason);
			}
			comment = Morebits.string.appendPunctuation(comment);
			comment += '--~~~~';
			comment = comment.replace(/\r?\n/g, '\n*:');  // indent newlines

			reason = comment;
			break;

		// WP:SPI
		case 'spi':
			if (!input.reason) {
				alert(wgULS('请输入证据。', '請輸入證據。'));
				return;
			}

			var sockpuppets = Morebits.array.uniq($.map($('input:text[name=sockpuppet]', form), function(o) {
				return $(o).val().trim() || null;
			}));
			if (!sockpuppets[0]) {
				alert(wgULS('您没有指定任何傀儡。', '您沒有指定任何傀儡。'));
				return;
			}

			comment += '{{subst:SPI report|';
			if (sockpuppets.indexOf(input.sockmaster) === -1) {
				comment += '1={{subst:#ifexist:{{subst:FULLPAGENAME}}||' + input.sockmaster + '}}|';
			}
			comment += sockpuppets.map(function(sock, index) {
				return (index + 2) + '=' + sock;
			}).join('|') + '\n|evidence=' + Morebits.string.appendPunctuation(input.reason) + '\n';

			if (input.checkuser) {
				comment += '|checkuser=yes';
			}
			comment += '}}';

			reason = comment;
			break;
	}

	return [reason, comment];
};

Twinkle.arv.callback.evaluate = function(e) {
	var form = e.target;
	var input = Morebits.quickForm.getInputData(form);
	var uid = input.uid;
	var reason;

	var summary;
	switch (input.category) {
		// Report user for vandalism
		case 'aiv':
			/* falls through */
		default:
			reason = Twinkle.arv.callback.getReportWikitext(form);
			if (reason === undefined) {
				return;
			}

			summary = wgULS('报告', '報告') + '[[Special:Contributions/' + uid + '|' + uid + ']]';
			if (input.hidename) {
				summary = wgULS('报告一名用户', '報告一名使用者');
			}

			Morebits.simpleWindow.setButtonsEnabled(false);
			Morebits.status.init(form);

			Morebits.wiki.actionCompleted.redirect = 'Wikipedia:当前的破坏';
			Morebits.wiki.actionCompleted.notice = wgULS('报告完成', '報告完成');

			var aivPage = new Morebits.wiki.page('Wikipedia:当前的破坏', wgULS('处理VIP请求', '處理VIP請求'));
			aivPage.setFollowRedirect(true);

			aivPage.load(function() {
				var text = aivPage.getPageText();
				var $aivLink = '<a target="_blank" href="/wiki/WP:VIP">WP:VIP</a>';

				// check if user has already been reported
				if (new RegExp('===\\s*\\{\\{\\s*(?:[Vv]andal)\\s*\\|\\s*(?:1=)?\\s*' + Morebits.string.escapeRegExp(uid) + '\\s*\\}\\}\\s*===').test(text)) {
					aivPage.getStatusElement().error(wgULS('报告已存在，将不会加入新的', '報告已存在，將不會加入新的'));
					Morebits.status.printUserText(reason[1], wgULS('您输入的评论已在下方提供，您可以将其加入到', '您輸入的評論已在下方提供，您可以將其加入到') + $aivLink + wgULS('已存在的小节中：', '已存在的小節中：'));
					return;
				}
				aivPage.setPageSection(0);
				aivPage.getStatusElement().status(wgULS('加入新报告…', '加入新報告…'));
				aivPage.setEditSummary(summary);
				aivPage.setChangeTags(Twinkle.changeTags);
				aivPage.setAppendText('\n' + reason[0]);
				aivPage.append();
			});
			break;
		// Report 3RR
		case 'ewip':
			reason = Twinkle.arv.callback.getReportWikitext(form);
			if (reason === undefined) {
				return;
			}

			summary = wgULS('报告', '報告') + '[[Special:Contributions/' + uid + '|' + uid + ']]';

			Morebits.simpleWindow.setButtonsEnabled(false);
			Morebits.status.init(form);

			Morebits.wiki.actionCompleted.redirect = 'Wikipedia:管理员布告板/编辑争议';
			Morebits.wiki.actionCompleted.notice = wgULS('报告完成', '報告完成');

			var ewipPage = new Morebits.wiki.page('Wikipedia:管理员布告板/编辑争议', wgULS('处理EWIP请求', '處理EWIP請求'));
			ewipPage.setFollowRedirect(true);

			ewipPage.load(function() {
				var text = ewipPage.getPageText();
				var $ewipLink = '<a target="_blank" href="/wiki/WP:EWIP">WP:EWIP</a>';

				// check if user has already been reported
				if (new RegExp('===\\s*\\{\\{\\s*(?:[Vv]andal)\\s*\\|\\s*(?:1=)?\\s*' + Morebits.string.escapeRegExp(uid) + '\\s*\\}\\}\\s*===').test(text)) {
					ewipPage.getStatusElement().error(wgULS('报告已存在，将不会加入新的', '報告已存在，將不會加入新的'));
					Morebits.status.printUserText(reason[1], wgULS('您输入的评论已在下方提供，您可以将其加入到', '您輸入的評論已在下方提供，您可以將其加入到') + $ewipLink + wgULS('已存在的小节中：', '已存在的小節中：'));
					return;
				}
				ewipPage.setPageSection(0);
				ewipPage.getStatusElement().status(wgULS('加入新报告…', '加入新報告…'));
				ewipPage.setEditSummary(summary);
				ewipPage.setChangeTags(Twinkle.changeTags);
				ewipPage.setAppendText('\n' + reason[0]);
				ewipPage.append();
			});
			break;

		// Report inappropriate username
		case 'username':
			reason = Twinkle.arv.callback.getReportWikitext(form);

			Morebits.simpleWindow.setButtonsEnabled(false);
			Morebits.status.init(form);

			Morebits.wiki.actionCompleted.redirect = 'Wikipedia:需要管理員注意的用戶名';
			Morebits.wiki.actionCompleted.notice = wgULS('报告完成', '報告完成');

			var uaaPage = new Morebits.wiki.page('Wikipedia:需要管理員注意的用戶名', wgULS('处理UAA请求', '處理UAA請求'));
			uaaPage.setFollowRedirect(true);

			uaaPage.load(function() {
				var text = uaaPage.getPageText();

				// check if user has already been reported
				if (new RegExp('\\{\\{\\s*user-uaa\\s*\\|\\s*(1\\s*=\\s*)?' + Morebits.string.escapeRegExp(uid) + '\\s*(\\||\\})').test(text)) {
					uaaPage.getStatusElement().error(wgULS('用户已被列入。', '使用者已被列入。'));
					var $uaaLink = '<a target="_blank" href="/wiki/WP:UAA">WP:UAA</a>';
					Morebits.status.printUserText(reason[1], wgULS('您输入的评论已在下方提供，您可以将其手工加入', '您輸入的評論已在下方提供，您可以將其手工加入') + $uaaLink + wgULS('上该用户的报告中：', '上該使用者的報告中：'));
					return;
				}
				uaaPage.getStatusElement().status(wgULS('加入新报告…', '加入新報告…'));
				uaaPage.setEditSummary(wgULS('新提报', '新提報'));
				uaaPage.setChangeTags(Twinkle.changeTags);
				uaaPage.setAppendText('\n\n' + reason[0]);
				uaaPage.append();
			});
			break;

		// WP:SPI
		case 'spi':
			reason = Twinkle.arv.callback.getReportWikitext(form);

			Morebits.simpleWindow.setButtonsEnabled(false);
			Morebits.status.init(form);

			var reportpage = 'Wikipedia:傀儡調查/案件/' + input.sockmaster;

			Morebits.wiki.actionCompleted.redirect = reportpage;
			Morebits.wiki.actionCompleted.notice = wgULS('报告完成', '報告完成');

			var spiPage = new Morebits.wiki.page(reportpage, wgULS('抓取讨论页面', '抓取討論頁面'));
			spiPage.setFollowRedirect(true);
			spiPage.setEditSummary(wgULS('加入新提报', '加入新提報'));
			spiPage.setChangeTags(Twinkle.changeTags);
			spiPage.setAppendText(reason[0]);
			spiPage.setWatchlist(Twinkle.getPref('spiWatchReport'));
			spiPage.append();
			break;
	}
};

Twinkle.addInitCallback(Twinkle.arv, 'arv');
})(jQuery);


// </nowiki>
