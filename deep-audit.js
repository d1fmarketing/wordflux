import puppeteer from 'puppeteer';

async function deepAudit() {
  console.log('🔍 INVESTIGAÇÃO PROFUNDA DO WORDFLUX\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    devtools: false
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  // Track all network requests
  const failedRequests = [];
  const apiCalls = [];
  
  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      reason: request.failure().errorText
    });
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      apiCalls.push({
        url: response.url(),
        status: response.status(),
        ok: response.ok()
      });
    }
  });
  
  const URL = 'https://smithsonian-posing-interfaces-bias.trycloudflare.com';
  
  console.log(`📡 Abrindo: ${URL}\n`);
  
  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for page to settle
    await new Promise(r => setTimeout(r, 3000));
    
    // GET PAGE STATE
    const pageState = await page.evaluate(() => {
      const result = {
        title: document.title,
        hasMain: !!document.getElementById('main'),
        hasChatInput: !!document.getElementById('chat-input'),
        hasChatSend: !!document.getElementById('chat-send'),
        hasCampaignBtn: !!document.getElementById('open-campaign'),
        hasKanban: !!document.getElementById('kanban'),
        chatLogChildren: document.getElementById('chat-log')?.children.length || 0,
        kanbanColumns: [],
        allCards: [],
        jsErrors: []
      };
      
      // Check kanban columns
      const kanban = document.getElementById('kanban');
      if (kanban) {
        const cols = kanban.querySelectorAll(':scope > div');
        cols.forEach(col => {
          const h3 = col.querySelector('h3');
          const cards = col.querySelectorAll('div[style*="background"]').length;
          if (h3) {
            result.kanbanColumns.push({
              name: h3.innerText,
              cardCount: cards
            });
          }
        });
      }
      
      // Check all cards
      const allCards = document.querySelectorAll('button[data-move="true"]');
      allCards.forEach(btn => {
        result.allCards.push({
          id: btn.getAttribute('data-cardid'),
          from: btn.getAttribute('data-from'),
          to: btn.getAttribute('data-to')
        });
      });
      
      return result;
    });
    
    console.log('📊 PAGE STATE:');
    console.log('- Title:', pageState.title);
    console.log('- Has main element:', pageState.hasMain);
    console.log('- Has chat input:', pageState.hasChatInput);
    console.log('- Has chat send:', pageState.hasChatSend);
    console.log('- Has campaign button:', pageState.hasCampaignBtn);
    console.log('- Has kanban:', pageState.hasKanban);
    console.log('- Chat messages:', pageState.chatLogChildren);
    console.log('- Kanban columns:', pageState.kanbanColumns);
    console.log('- Cards found:', pageState.allCards.length);
    
    // TEST CHAT DEEPLY
    console.log('\n🤖 TESTING CHAT IN DETAIL:');
    
    let newChatCount = pageState.chatLogChildren;
    if (pageState.hasChatInput && pageState.hasChatSend) {
      // Clear input first
      await page.evaluate(() => {
        document.getElementById('chat-input').value = '';
      });
      
      // Type message
      await page.type('#chat-input', 'Test message from deep audit');
      
      // Get input value to confirm
      const inputValue = await page.evaluate(() => {
        return document.getElementById('chat-input').value;
      });
      console.log('- Input value:', inputValue);
      
      // Click send
      await page.click('#chat-send');
      console.log('- Clicked send button');
      
      // Wait for any API call
      await new Promise(r => setTimeout(r, 5000));
      
      // Check chat log again
      newChatCount = await page.evaluate(() => {
        return document.getElementById('chat-log')?.children.length || 0;
      });
      console.log('- Messages after send:', newChatCount);
      console.log('- New messages added:', newChatCount - pageState.chatLogChildren);
      
      // Get last message
      const lastMessage = await page.evaluate(() => {
        const log = document.getElementById('chat-log');
        if (log && log.lastElementChild) {
          return log.lastElementChild.innerText;
        }
        return 'NO MESSAGE';
      });
      console.log('- Last message:', lastMessage.substring(0, 100));
    }
    
    // TEST CAMPAIGN MODAL
    console.log('\n📋 TESTING CAMPAIGN MODAL:');
    
    const campaignBtn = await page.$('#open-campaign');
    if (campaignBtn) {
      // Get initial modal state
      const modalStateBefore = await page.evaluate(() => {
        const modal = document.getElementById('campaign-modal');
        return {
          exists: !!modal,
          display: modal ? modal.style.display : 'not found',
          className: modal ? modal.className : 'not found'
        };
      });
      console.log('- Modal before click:', modalStateBefore);
      
      // Click button
      await campaignBtn.click();
      await new Promise(r => setTimeout(r, 1500));
      
      // Get modal state after
      const modalStateAfter = await page.evaluate(() => {
        const modal = document.getElementById('campaign-modal');
        return {
          exists: !!modal,
          display: modal ? modal.style.display : 'not found',
          visible: modal && (modal.style.display !== 'none')
        };
      });
      console.log('- Modal after click:', modalStateAfter);
    }
    
    // CHECK JAVASCRIPT ERRORS
    console.log('\n⚠️ JAVASCRIPT STATUS:');
    
    const jsStatus = await page.evaluate(() => {
      const checkFunction = (name) => {
        try {
          return typeof window[name] === 'function' || 
                 (document.getElementById(name) && 
                  document.getElementById(name).onclick !== null);
        } catch (e) {
          return false;
        }
      };
      
      return {
        hasWindow: typeof window !== 'undefined',
        hasDocument: typeof document !== 'undefined',
        hasLocalStorage: typeof localStorage !== 'undefined',
        hasFetch: typeof fetch === 'function'
      };
    });
    
    console.log('- Has window:', jsStatus.hasWindow);
    console.log('- Has document:', jsStatus.hasDocument);
    console.log('- Has localStorage:', jsStatus.hasLocalStorage);
    console.log('- Has fetch:', jsStatus.hasFetch);
    
    // NETWORK ANALYSIS
    console.log('\n🌐 NETWORK ANALYSIS:');
    console.log('- Failed requests:', failedRequests.length);
    if (failedRequests.length > 0) {
      failedRequests.forEach(req => {
        console.log(`  ❌ ${req.url}: ${req.reason}`);
      });
    }
    
    console.log('- API calls made:', apiCalls.length);
    apiCalls.forEach(call => {
      console.log(`  ${call.ok ? '✅' : '❌'} ${call.url}: ${call.status}`);
    });
    
    // CHECK LOCAL STORAGE
    console.log('\n💾 LOCAL STORAGE:');
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        items[key] = window.localStorage.getItem(key)?.substring(0, 50) + '...';
      }
      return items;
    });
    console.log('- Items in localStorage:', Object.keys(localStorage).length);
    Object.entries(localStorage).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value}`);
    });
    
    // FINAL DIAGNOSIS
    console.log('\n' + '='.repeat(60));
    console.log('🩺 DIAGNOSIS:\n');
    
    const problems = [];
    
    if (failedRequests.length > 0) {
      problems.push(`${failedRequests.length} network requests failed`);
    }
    
    if (pageState.allCards.length === 0) {
      problems.push('No cards visible in Kanban');
    }
    
    if (newChatCount === pageState.chatLogChildren) {
      problems.push('Chat not adding messages after send');
    }
    
    if (problems.length === 0) {
      console.log('✅ TUDO PARECE ESTAR FUNCIONANDO!');
    } else {
      console.log('❌ PROBLEMAS ENCONTRADOS:');
      problems.forEach(p => console.log(`  - ${p}`));
    }
    
    console.log('\n' + '='.repeat(60));
    
    await page.screenshot({ path: 'deep-audit.png' });
    console.log('\n📸 Screenshot: deep-audit.png');
    
  } catch (error) {
    console.log('💀 ERRO FATAL:', error.message);
  }
  
  await browser.close();
}

deepAudit().catch(console.error);