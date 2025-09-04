// WordFlux Client-Side JavaScript
// This file is loaded separately to avoid SSR issues

window.initWordFlux = function() {
  console.log('WordFlux client initializing...');
  // Get initial board from window or use default
  const initialBoard = window.__WF_INITIAL_BOARD || {
    id: "default",
    wipLimits: { Doing: 4 },
    columns: [
      { id: "Backlog", name: "Backlog", cards: [] },
      { id: "Doing", name: "Doing", cards: [] },
      { id: "Done", name: "Done", cards: [] }
    ]
  };

  const log = document.getElementById('chat-log');
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const clearBtn = document.getElementById('chat-clear');
  const campaignModal = document.getElementById('campaign-modal');
  const openCampaignBtn = document.getElementById('open-campaign');
  const cgClose = document.getElementById('cg-close');
  const cgGenerate = document.getElementById('cg-generate');
  const cgStatus = document.getElementById('cg-status');
  const menuMoreBtn = document.getElementById('menu-more');
  const menuPanel = document.getElementById('menu-panel');
  
  // Mobile drawer elements
  const chatToggle = document.getElementById('chat-toggle');
  const chatSidebar = document.getElementById('chat-sidebar');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  const sidebarClose = document.getElementById('sidebar-close');
  
  // Mobile drawer toggle handler
  if (chatToggle && chatSidebar) {
    chatToggle.addEventListener('click', function() {
      chatSidebar.classList.toggle('-translate-x-full');
      chatSidebar.classList.toggle('translate-x-0');
      sidebarBackdrop.classList.toggle('hidden');
      sidebarBackdrop.classList.toggle('block');
    });
  }
  
  if (sidebarClose && chatSidebar) {
    sidebarClose.addEventListener('click', function() {
      chatSidebar.classList.add('-translate-x-full');
      chatSidebar.classList.remove('translate-x-0');
      sidebarBackdrop.classList.add('hidden');
      sidebarBackdrop.classList.remove('block');
    });
  }
  
  if (sidebarBackdrop && chatSidebar) {
    sidebarBackdrop.addEventListener('click', function() {
      chatSidebar.classList.add('-translate-x-full');
      chatSidebar.classList.remove('translate-x-0');
      sidebarBackdrop.classList.add('hidden');
      sidebarBackdrop.classList.remove('block');
    });
  }
  
  // Chat send handler
  async function sendMessage() {
    const message = input.value.trim();
    if (!message) return;
    
    // Add user message
    const userDiv = document.createElement('div');
    userDiv.className = 'p-3 rounded-lg bg-[#1a1a2e] text-[var(--wf-soft)]';
    userDiv.textContent = message;
    log.appendChild(userDiv);
    
    input.value = '';
    input.style.height = 'auto'; // Reset textarea height
    log.scrollTop = log.scrollHeight; // Scroll to bottom
    
    // Call API
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: message }] })
      });
      
      const data = await response.json();
      
      // Add AI response
      const aiDiv = document.createElement('div');
      aiDiv.className = 'p-3 rounded-lg bg-[var(--surface-alt)] text-[var(--wf-soft)]';
      aiDiv.textContent = data.response || 'Sem resposta';
      log.appendChild(aiDiv);
      
      // Scroll to bottom
      log.scrollTop = log.scrollHeight;
    } catch (e) {
      console.error('Chat error:', e);
      const errorDiv = document.createElement('div');
      errorDiv.className = 'p-3 rounded-lg bg-red-600 text-white';
      errorDiv.textContent = 'Erro ao conectar com GPT-5';
      log.appendChild(errorDiv);
    }
  }
  
  // Chat handlers
  if (sendBtn && input) {
    sendBtn.addEventListener('click', sendMessage);
    
    // Keyboard shortcuts: Enter to send, Shift+Enter for newline
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    
    // Auto-resize textarea
    input.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
  }
  
  // Clear chat button
  if (clearBtn && log) {
    clearBtn.addEventListener('click', function() {
      // Keep only the initial message
      const firstMessage = log.firstElementChild;
      log.innerHTML = '';
      if (firstMessage) log.appendChild(firstMessage);
    });
  }
  
  // Campaign modal handler
  if (openCampaignBtn && campaignModal) {
    openCampaignBtn.addEventListener('click', function() {
      campaignModal.style.display = 'flex';
    });
    
    if (cgClose) {
      cgClose.addEventListener('click', function() {
        campaignModal.style.display = 'none';
      });
    }
    
    if (cgGenerate) {
      cgGenerate.addEventListener('click', async function() {
        cgStatus.textContent = 'Gerando campanha com GPT-5...';
        
        // Get form values
        const type = document.getElementById('cg-type')?.value || 'Social Media';
        const brand = document.getElementById('cg-brand')?.value || 'Cliente';
        const duration = document.getElementById('cg-duration')?.value || '1 month';
        const budget = document.getElementById('cg-budget')?.value || 'Medium';
        const audience = document.getElementById('cg-audience')?.value || 'Geral';
        
        try {
          const prompt = `Gere uma campanha de ${type} para ${brand} com duração de ${duration}, orçamento ${budget}, para público ${audience}. Liste 20-30 tarefas específicas em português brasileiro.`;
          
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              messages: [{ role: 'user', content: prompt }],
              generateCampaign: true
            })
          });
          
          const data = await response.json();
          
          if (data.campaign) {
            // Apply campaign to board
            await fetch('/api/board/apply', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                op: 'apply_campaign',
                args: { tasks: data.campaign }
              })
            });
            
            cgStatus.textContent = 'Campanha criada com sucesso!';
            setTimeout(() => {
              campaignModal.style.display = 'none';
              location.reload(); // Reload to show new cards
            }, 1500);
          }
        } catch (e) {
          console.error('Campaign error:', e);
          cgStatus.textContent = 'Erro ao gerar campanha';
        }
      });
    }
  }
  
  // Menu handler
  if (menuMoreBtn && menuPanel) {
    menuMoreBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const isVisible = menuPanel.style.display === 'block';
      menuPanel.style.display = isVisible ? 'none' : 'block';
    });
    
    document.addEventListener('click', function() {
      if (menuPanel) {
        menuPanel.style.display = 'none';
      }
    });
  }
  
  // WIP badge click handlers - make them editable
  document.querySelectorAll('[data-wip-badge]').forEach(badge => {
    badge.addEventListener('click', async function() {
      const columnId = badge.getAttribute('data-wip-badge');
      const currentLimit = badge.textContent.includes('/') 
        ? parseInt(badge.textContent.split('/')[1]) 
        : null;
      
      const newLimit = prompt(`Set WIP limit for column (0 to remove):`, currentLimit || '');
      if (newLimit === null) return;
      
      const limit = parseInt(newLimit);
      if (isNaN(limit) || limit < 0) {
        alert('Please enter a valid number');
        return;
      }
      
      try {
        await fetch('/api/board/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            op: 'set_wip_limit',
            args: { columnId, limit: limit || null }
          })
        });
        
        location.reload();
      } catch (e) {
        console.error('WIP limit error:', e);
        alert('Failed to update WIP limit');
      }
    });
  });
  
  // Move card handlers
  document.querySelectorAll('button[data-move="true"]').forEach(btn => {
    btn.addEventListener('click', async function() {
      const cardId = btn.getAttribute('data-cardid');
      const from = btn.getAttribute('data-from');
      const to = btn.getAttribute('data-to');
      
      try {
        await fetch('/api/board/move-card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId, fromColumnId: from, toColumnId: to })
        });
        
        // Simple reload for now
        location.reload();
      } catch (e) {
        console.error('Move error:', e);
      }
    });
  });
  
  // WhatsApp share
  const shareBtn = document.getElementById('share-whatsapp');
  if (shareBtn) {
    shareBtn.addEventListener('click', function() {
      const text = encodeURIComponent('Confira o progresso do projeto no WordFlux: ' + location.href);
      window.open('https://wa.me/?text=' + text, '_blank');
    });
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWordFlux);
} else {
  initWordFlux();
}