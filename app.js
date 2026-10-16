let currentService = "Home Cleaning";
    let currentPrice = 199;
    let currentEta = "15 mins";
    let currentHours = 1;
    let selectedFrequency = "One-Time";
    let selectedProPreference = "Auto-Assign";
    let selectedPaymentMethod = "UPI — GPay / PhonePe";
    let activePromoCode = "";
    let discountAmount = 0;

    let walletBalance = 500;
    let currentFilter = "ALL";
    let isDarkMode = false;
    let currentWizardStep = 1;

    let trackedBookingId = null;
    let trackerStageIndex = 0;
    let trackerTimer = null;
    let chatReplyTimer = null;
    let activeReceiptPlainText = "";

    const TRACKER_MESSAGES = [
      "Pro confirmed your booking and packed supplies.",
      "🛵 Pro is on the way (~8 mins away via Jubilee Hills Rd).",
      "🏠 Pro has arrived at your doorstep! Share OTP to begin.",
      "🧹 Chore is underway! Mark Done in Bookings when finished."
    ];

    const STORAGE_KEY = "sifto_saved_bookings_v1";
    const WALLET_KEY = "sifto_wallet_balance_v1";
    const THEME_KEY = "sifto_theme_dark_v1";
    const CUSTOM_CHORES_KEY = "sifto_custom_chores_v1";
    let activeBookings = [];
    let customChores = [];

    function goWizardStep(stepNum) {
      currentWizardStep = stepNum;
      for (let i = 1; i <= 3; i++) {
        const pane = document.getElementById("wiz-pane-" + i);
        const tab = document.getElementById("wiz-tab-" + i);
        if (i === stepNum) {
          pane.classList.add("active-pane");
          tab.classList.add("active-wizard");
        } else {
          pane.classList.remove("active-pane");
          tab.classList.remove("active-wizard");
        }
      }
      updateSummaryBar();
    }

    function switchPage(pageName) {
      const pages = ["book", "track", "bookings", "wallet", "partner"];
      pages.forEach(p => {
        const pageEl = document.getElementById("page-" + p);
        const navEl = document.getElementById("nav-" + p);
        if (p === pageName) {
          pageEl.classList.add("active-page");
          navEl.classList.add("active-nav");
        } else {
          pageEl.classList.remove("active-page");
          navEl.classList.remove("active-nav");
        }
      });
    }

    // NEW IN STEP 9: Adds a user-created custom chore card to the Service Grid
    function createCustomChoreCard(chore) {
      const grid = document.getElementById("service-grid");
      if (!grid) return null;

      const btn = document.createElement("button");
      btn.className = "service-card";
      btn.innerHTML =
        '<span class="service-icon">' + chore.icon + '</span>' +
        '<span class="service-name">' + chore.name + '</span>' +
        '<span class="service-meta">Custom Sifto service</span>' +
        '<span class="service-price">₹' + chore.price + ' / hr</span>';
      btn.addEventListener("click", function() {
        selectService(btn, chore.name, chore.price, "15 mins");
      });
      grid.appendChild(btn);
      return btn;
    }

    function addCustomChore() {
      const iconEl = document.getElementById("custom-chore-icon");
      const nameEl = document.getElementById("custom-chore-name");
      const priceEl = document.getElementById("custom-chore-price");
      const feedbackEl = document.getElementById("custom-chore-feedback");

      const name = nameEl.value.trim();
      const price = parseInt(priceEl.value, 10) || 159;
      const icon = iconEl.value || "🪴";

      if (!name) {
        feedbackEl.className = "promo-feedback error";
        feedbackEl.textContent = "Please enter a name for your custom chore (e.g. Balcony Garden).";
        nameEl.focus();
        return;
      }

      const newChore = { icon: icon, name: name, price: Math.max(49, price) };
      customChores.push(newChore);
      try {
        localStorage.setItem(CUSTOM_CHORES_KEY, JSON.stringify(customChores));
      } catch (e) {}

      const newBtn = createCustomChoreCard(newChore);
      if (newBtn) {
        selectService(newBtn, newChore.name, newChore.price, "15 mins");
      }

      nameEl.value = "";
      feedbackEl.className = "promo-feedback success";
      feedbackEl.textContent = "✨ Added '" + newChore.name + "' (₹" + newChore.price + "/hr) and selected it!";
    }

    // NEW IN STEP 9: Switches between saved addresses with 1 tap
    function selectSavedAddress(clickedPill, addressText) {
      const allPills = document.querySelectorAll(".address-pill");
      allPills.forEach(p => p.classList.remove("selected"));
      clickedPill.classList.add("selected");

      const addressInput = document.getElementById("address-input");
      addressInput.value = addressText;
    }

    // NEW IN STEP 9: Saves whatever address is typed in the box as a new 1-tap pill
    function saveCurrentAddressToBook() {
      const addressInput = document.getElementById("address-input");
      const text = addressInput.value.trim();
      if (!text) return;

      const row = document.getElementById("address-book-row");
      const allPills = document.querySelectorAll(".address-pill");
      allPills.forEach(p => p.classList.remove("selected"));

      const pill = document.createElement("button");
      pill.className = "address-pill selected";
      const shortLabel = text.length > 22 ? text.slice(0, 22) + "…" : text;
      pill.textContent = "📍 " + shortLabel;
      pill.addEventListener("click", function() {
        selectSavedAddress(pill, text);
      });
      row.appendChild(pill);
    }

    function loadSavedBookings() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          activeBookings = JSON.parse(raw);
        }
        const savedWallet = localStorage.getItem(WALLET_KEY);
        if (savedWallet !== null) {
          walletBalance = parseInt(savedWallet, 10) || 0;
        }
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme === "true") {
          isDarkMode = true;
          document.body.classList.add("dark-mode");
          document.getElementById("theme-toggle-btn").textContent = "☀️ Light Mode";
        }
        const savedChores = localStorage.getItem(CUSTOM_CHORES_KEY);
        if (savedChores) {
          customChores = JSON.parse(savedChores);
          customChores.forEach(c => createCustomChoreCard(c));
        }
      } catch (e) {
        activeBookings = [];
      }
      updateWalletDisplay();
      renderBookings();
    }

    function saveBookingsToStorage() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activeBookings));
        localStorage.setItem(WALLET_KEY, String(walletBalance));
      } catch (e) {}
    }

    function toggleDarkMode() {
      isDarkMode = !isDarkMode;
      document.body.classList.toggle("dark-mode", isDarkMode);
      const btn = document.getElementById("theme-toggle-btn");
      btn.textContent = isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode";
      try {
        localStorage.setItem(THEME_KEY, String(isDarkMode));
      } catch (e) {}
    }

    function updateWalletDisplay() {
      document.getElementById("wallet-balance").textContent = "₹" + walletBalance;
      const statWallet = document.getElementById("stat-wallet-card");
      if (statWallet) {
        statWallet.textContent = "₹" + walletBalance;
      }
    }

    function topUpWallet(amount) {
      walletBalance += amount;
      updateWalletDisplay();
      saveBookingsToStorage();
    }

    function selectPayment(clickedCard, method) {
      selectedPaymentMethod = method;
      const allPaymentCards = document.querySelectorAll(".payment-card");
      allPaymentCards.forEach(card => card.classList.remove("selected"));
      clickedCard.classList.add("selected");
    }

    function selectFrequency(clickedPill, freq) {
      selectedFrequency = freq;
      const allPills = document.querySelectorAll(".plan-pill");
      allPills.forEach(pill => pill.classList.remove("selected"));
      clickedPill.classList.add("selected");
      updateSummaryBar();
    }

    function setBookingFilter(clickedTab, filterType) {
      currentFilter = filterType;
      const allTabs = document.querySelectorAll(".filter-tab");
      allTabs.forEach(tab => tab.classList.remove("selected"));
      clickedTab.classList.add("selected");
      renderBookings();
    }

    function calculateTotals() {
      const subtotal = currentPrice * currentHours;
      let discount = 0;

      if (selectedFrequency === "Weekly Plan") {
        discount += Math.round(subtotal * 0.15);
      }

      if (activePromoCode === "SIFTO50") {
        discount += 50;
      } else if (activePromoCode === "FIRST100" && currentHours >= 2) {
        discount += 100;
      }

      discountAmount = discount;
      const finalTotal = Math.max(49, subtotal - discountAmount);
      return { subtotal, discount: discountAmount, finalTotal };
    }

    function updateSummaryBar() {
      const totals = calculateTotals();
      const hourLabel = currentHours === 1 ? "1 hr" : currentHours + " hrs";
      const freqTag = selectedFrequency === "Weekly Plan" ? " · Weekly" : "";
      document.getElementById("selected-name").textContent = currentService + " · " + hourLabel + freqTag;

      const breakdownEl = document.getElementById("price-breakdown");
      if (totals.discount > 0) {
        breakdownEl.innerHTML =
          "₹" + totals.subtotal + ' <span class="discount-tag">(-₹' + totals.discount + " saved)</span>";
      } else {
        breakdownEl.textContent = "₹" + currentPrice + " × " + hourLabel;
      }

      document.getElementById("selected-price").textContent = "₹" + totals.finalTotal;
    }

    function selectService(clickedCard, serviceName, price, eta) {
      currentService = serviceName;
      currentPrice = price;
      currentEta = eta;

      const allCards = document.querySelectorAll(".service-card");
      allCards.forEach(card => card.classList.remove("selected"));
      clickedCard.classList.add("selected");

      updateSummaryBar();
    }

    function selectHours(clickedPill, hours) {
      currentHours = hours;

      const allPills = document.querySelectorAll(".hour-pill");
      allPills.forEach(pill => pill.classList.remove("selected"));
      clickedPill.classList.add("selected");

      if (activePromoCode === "FIRST100") {
        applyPromoCode();
      } else {
        updateSummaryBar();
      }
    }

    function selectPro(clickedProCard, proName) {
      selectedProPreference = proName;

      const allProCards = document.querySelectorAll(".pro-card");
      allProCards.forEach(card => card.classList.remove("selected"));
      clickedProCard.classList.add("selected");
    }

    function addQuickNote(noteText) {
      const notesInput = document.getElementById("notes-input");
      if (!notesInput.value.trim()) {
        notesInput.value = noteText;
      } else if (notesInput.value.indexOf(noteText) === -1) {
        notesInput.value = notesInput.value.trim() + " · " + noteText;
      }
    }

    function quickFillPromo(code) {
      document.getElementById("promo-input").value = code;
      applyPromoCode();
    }

    function applyPromoCode() {
      const inputEl = document.getElementById("promo-input");
      const feedbackEl = document.getElementById("promo-feedback");
      const code = inputEl.value.trim().toUpperCase();

      if (!code) {
        activePromoCode = "";
        feedbackEl.className = "promo-feedback";
        feedbackEl.textContent = "";
        updateSummaryBar();
        return;
      }

      if (code === "SIFTO50") {
        activePromoCode = "SIFTO50";
        feedbackEl.className = "promo-feedback success";
        feedbackEl.textContent = "🎉 SIFTO50 applied! You saved ₹50 on this booking.";
      } else if (code === "FIRST100") {
        if (currentHours >= 2) {
          activePromoCode = "FIRST100";
          feedbackEl.className = "promo-feedback success";
          feedbackEl.textContent = "🎉 FIRST100 applied! You saved ₹100 on your 2+ hour booking.";
        } else {
          activePromoCode = "";
          feedbackEl.className = "promo-feedback error";
          feedbackEl.textContent = "FIRST100 requires at least 2 hours. Tap 2 hrs on Step ① or use SIFTO50!";
        }
      } else {
        activePromoCode = "";
        feedbackEl.className = "promo-feedback error";
        feedbackEl.textContent = "Invalid code. Try SIFTO50 or FIRST100.";
      }

      updateSummaryBar();
    }

    function renderChatMessages() {
      const chatContainer = document.getElementById("chat-messages");
      if (!chatContainer || !trackedBookingId) return;

      const target = activeBookings.find(item => item.id === trackedBookingId);
      if (!target) return;

      const messages = target.messages || [];
      chatContainer.innerHTML = "";
      messages.forEach(msg => {
        const bubble = document.createElement("div");
        bubble.className = msg.role === "user" ? "chat-bubble user" : "chat-bubble pro";
        bubble.innerHTML =
          '<span class="chat-sender">' + msg.sender + '</span>' +
          '<div>' + msg.text + '</div>';
        chatContainer.appendChild(bubble);
      });
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function sendChatMessage() {
      const inputEl = document.getElementById("chat-input");
      const text = inputEl.value.trim();
      if (!text || !trackedBookingId) return;

      inputEl.value = "";
      appendMessageToBooking(trackedBookingId, "user", "You (Sifto)", text);

      if (chatReplyTimer) {
        clearTimeout(chatReplyTimer);
      }
      chatReplyTimer = setTimeout(function() {
        const target = activeBookings.find(item => item.id === trackedBookingId);
        if (!target) return;
        const proName = target.pro || "Sifto Pro";
        const replyText =
          "Got your note, Sifto! I am on my way and will follow that instruction 👍";
        appendMessageToBooking(trackedBookingId, "pro", proName, replyText);
      }, 900);
    }

    function sendQuickChat(presetText) {
      const inputEl = document.getElementById("chat-input");
      inputEl.value = presetText;
      sendChatMessage();
    }

    function appendMessageToBooking(bookingId, role, sender, text) {
      activeBookings = activeBookings.map(item => {
        if (item.id === bookingId) {
          const existing = item.messages ? item.messages.slice() : [];
          existing.push({ role: role, sender: sender, text: text });
          return Object.assign({}, item, { messages: existing });
        }
        return item;
      });
      saveBookingsToStorage();
      renderChatMessages();
    }

    function openReceiptModal(bookingId) {
      const target = activeBookings.find(item => item.id === bookingId);
      if (!target) return;

      const modal = document.getElementById("receipt-modal");
      const content = document.getElementById("receipt-modal-content");
      const feedback = document.getElementById("copy-receipt-feedback");
      feedback.className = "promo-feedback";
      feedback.textContent = "";

      const freq = target.frequency || "One-Time";
      const saved = target.discount || 0;
      const payMethod = target.payment || "UPI — GPay / PhonePe";

      content.innerHTML =
        "<strong>Booking ID:</strong> #" + target.id + "<br>" +
        "<strong>Customer:</strong> Sifto<br>" +
        "<strong>Service:</strong> " + target.service + " (" + target.hours + " hr · " + freq + ")<br>" +
        "<strong>Assigned Pro:</strong> " + target.pro + "<br>" +
        "<strong>Address:</strong> " + target.address + "<br>" +
        "<strong>Slot:</strong> " + target.slot + "<br>" +
        "<strong>Payment Mode:</strong> " + payMethod + "<br>" +
        "<strong>Discount Saved:</strong> ₹" + saved + "<br>" +
        "<strong>Total Paid:</strong> ₹" + target.total + " (" + (target.status || "Active") + ")";

      activeReceiptPlainText =
        "SIFTO OFFICIAL RECEIPT (#" + target.id + ")\n" +
        "Service: " + target.service + " (" + target.hours + " hr · " + freq + ")\n" +
        "Pro: " + target.pro + "\n" +
        "Address: " + target.address + " (" + target.slot + ")\n" +
        "Payment: " + payMethod + " | Saved: ₹" + saved + "\n" +
        "Total: ₹" + target.total;

      modal.classList.add("visible");
    }

    function closeReceiptModal() {
      document.getElementById("receipt-modal").classList.remove("visible");
    }

    function copyReceiptText() {
      const feedback = document.getElementById("copy-receipt-feedback");
      try {
        const temp = document.createElement("textarea");
        temp.value = activeReceiptPlainText;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
      } catch (e) {}
      feedback.className = "promo-feedback success";
      feedback.textContent = "✅ Receipt copied to your clipboard!";
    }

    function startLiveTracker(booking) {
      trackedBookingId = booking.id;
      trackerStageIndex = booking.stage || 0;

      if (trackerTimer) {
        clearInterval(trackerTimer);
        trackerTimer = null;
      }

      document.getElementById("no-tracker-empty").style.display = "none";
      document.getElementById("live-tracker-card").classList.add("visible");
      document.getElementById("chat-card").classList.add("visible");
      document.getElementById("tracker-pro-title").textContent = "🛵 Tracking " + booking.pro + " (#" + booking.id + ")";
      document.getElementById("chat-header-title").textContent = "💬 Chat with " + booking.pro;
      document.getElementById("tracker-otp").textContent = "Start OTP: " + (booking.otp || "4829");
      renderTrackerStage();
      renderChatMessages();

      switchPage("track");

      trackerTimer = setInterval(function() {
        if (trackerStageIndex < 3) {
          advanceTrackerStage();
        } else {
          clearInterval(trackerTimer);
          trackerTimer = null;
        }
      }, 6000);
    }

    function renderTrackerStage() {
      const widths = ["25%", "50%", "75%", "100%"];
      document.getElementById("tracker-bar-fill").style.width = widths[trackerStageIndex] || "25%";
      document.getElementById("tracker-status-text").textContent = TRACKER_MESSAGES[trackerStageIndex];

      for (let i = 0; i < 4; i++) {
        const stepEl = document.getElementById("stage-" + i);
        if (i <= trackerStageIndex) {
          stepEl.classList.add("active");
        } else {
          stepEl.classList.remove("active");
        }
      }

      const btn = document.getElementById("advance-stage-btn");
      if (trackerStageIndex >= 3) {
        btn.textContent = "In Progress ✓";
      } else {
        btn.textContent = "Next Stage ▶";
      }
    }

    function advanceTrackerStage() {
      if (trackerStageIndex < 3) {
        trackerStageIndex += 1;
      }
      if (trackedBookingId) {
        activeBookings = activeBookings.map(item => {
          if (item.id === trackedBookingId) {
            return Object.assign({}, item, { stage: trackerStageIndex });
          }
          return item;
        });
        saveBookingsToStorage();
      }
      renderTrackerStage();
      renderPartnerConsole();
    }

    function partnerAdvanceJob(bookingId) {
      activeBookings = activeBookings.map(item => {
        if (item.id === bookingId) {
          const nextStage = Math.min(3, (item.stage || 0) + 1);
          if (trackedBookingId === bookingId) {
            trackerStageIndex = nextStage;
            renderTrackerStage();
          }
          return Object.assign({}, item, { stage: nextStage });
        }
        return item;
      });
      saveBookingsToStorage();
      renderBookings();
    }

    function bookSiftoPro() {
      const addressInput = document.getElementById("address-input");
      const slotInput = document.getElementById("slot-input");
      const notesInput = document.getElementById("notes-input");
      const errorBox = document.getElementById("address-error");
      const address = addressInput.value.trim();
      const note = notesInput.value.trim();

      if (!address) {
        errorBox.textContent = "Please enter your flat/house address on Step ② before booking.";
        errorBox.classList.add("visible");
        goWizardStep(2);
        addressInput.focus();
        return;
      }

      const totals = calculateTotals();

      if (selectedPaymentMethod === "Sifto Wallet") {
        if (walletBalance < totals.finalTotal) {
          errorBox.textContent =
            "Insufficient Sifto Wallet balance (₹" + walletBalance + "). Tap '+ Add ₹200' at the top or choose UPI!";
          errorBox.classList.add("visible");
          return;
        }
        walletBalance -= totals.finalTotal;
        updateWalletDisplay();
      }

      errorBox.classList.remove("visible");

      const pros = ["Ananya R. (⭐ 4.9)", "Kavitha M. (⭐ 4.9)", "Ramesh K. (⭐ 4.8)", "Priya S. (⭐ 4.9)"];
      const assignedPro =
        selectedProPreference === "Auto-Assign"
          ? pros[Math.floor(Math.random() * pros.length)]
          : selectedProPreference;

      const bookingId = "SFT-" + Math.floor(1000 + Math.random() * 9000);
      const otpCode = String(Math.floor(1000 + Math.random() * 9000));
      const chosenSlot = slotInput.value;

      const initialMessages = [
        {
          role: "pro",
          sender: assignedPro,
          text: "Hi Sifto! I have accepted your " + currentService + " booking (#" + bookingId + "). See you soon!"
        }
      ];

      const newBooking = {
        id: bookingId,
        otp: otpCode,
        service: currentService,
        frequency: selectedFrequency,
        hours: currentHours,
        total: totals.finalTotal,
        discount: totals.discount,
        pro: assignedPro,
        payment: selectedPaymentMethod,
        address: address,
        slot: chosenSlot,
        note: note,
        stage: 0,
        rating: 0,
        messages: initialMessages,
        status: "Active"
      };
      activeBookings.unshift(newBooking);
      saveBookingsToStorage();

      const details = document.getElementById("confirm-details");
      const discountLine =
        totals.discount > 0 ? " (Saved ₹" + totals.discount + ")" : "";
      const noteLine = note ? "<br><strong>Note:</strong> " + note : "";
      details.innerHTML =
        "<strong>Service:</strong> " + currentService + " · " + selectedFrequency + " (" + currentHours + " hr · ₹" + totals.finalTotal + ")" + discountLine + "<br>" +
        "<strong>Sifto Pro:</strong> " + assignedPro + "<br>" +
        "<strong>Payment:</strong> " + selectedPaymentMethod + "<br>" +
        "<strong>When & Where:</strong> " + chosenSlot + " → " + address +
        noteLine + "<br>" +
        "<strong>Booking ID:</strong> #" + bookingId + " · <strong>OTP:</strong> " + otpCode;

      document.getElementById("confirmation-box").classList.add("visible");
      notesInput.value = "";
      goWizardStep(1);

      startLiveTracker(newBooking);
      renderBookings();
    }

    function completeBooking(bookingId) {
      activeBookings = activeBookings.map(item => {
        if (item.id === bookingId) {
          return Object.assign({}, item, { status: "Completed ✅", stage: 3 });
        }
        return item;
      });
      if (trackedBookingId === bookingId) {
        if (trackerTimer) {
          clearInterval(trackerTimer);
          trackerTimer = null;
        }
        document.getElementById("live-tracker-card").classList.remove("visible");
        document.getElementById("chat-card").classList.remove("visible");
      }
      saveBookingsToStorage();
      renderBookings();
    }

    function rateBooking(bookingId, stars) {
      activeBookings = activeBookings.map(item => {
        if (item.id === bookingId) {
          return Object.assign({}, item, { rating: stars });
        }
        return item;
      });
      saveBookingsToStorage();
      renderBookings();
    }

    // NEW IN STEP 10: 1-Tap Rebook for any past booking
    function rebookBooking(bookingId) {
      const target = activeBookings.find(item => item.id === bookingId);
      if (!target) return;

      const newBookingId = "SFT-" + Math.floor(1000 + Math.random() * 9000);
      const newOtp = String(Math.floor(1000 + Math.random() * 9000));
      const cloned = Object.assign({}, target, {
        id: newBookingId,
        otp: newOtp,
        stage: 0,
        rating: 0,
        status: "Active",
        messages: [
          {
            role: "pro",
            sender: target.pro,
            text: "Hi Sifto! Your repeat booking (#" + newBookingId + ") is confirmed. On my way!"
          }
        ]
      });
      activeBookings.unshift(cloned);
      saveBookingsToStorage();
      startLiveTracker(cloned);
      renderBookings();
    }

    function exportBookingsJson() {
      const feedback = document.getElementById("data-feedback");
      const payload = JSON.stringify({ walletBalance: walletBalance, bookings: activeBookings, customChores: customChores }, null, 2);
      try {
        const temp = document.createElement("textarea");
        temp.value = payload;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
      } catch (e) {}
      feedback.className = "promo-feedback success";
      feedback.textContent = "✅ Copied full database JSON (" + activeBookings.length + " bookings) to clipboard!";
    }

    function resetDemoData() {
      activeBookings = [];
      customChores = [];
      walletBalance = 500;
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(WALLET_KEY);
        localStorage.removeItem(CUSTOM_CHORES_KEY);
      } catch (e) {}
      updateWalletDisplay();
      renderBookings();
      const feedback = document.getElementById("data-feedback");
      feedback.className = "promo-feedback success";
      feedback.textContent = "🔄 App data reset to fresh ₹500 wallet balance.";
    }

    function cancelBooking(bookingId) {
      const target = activeBookings.find(item => item.id === bookingId);
      const isDone = target && target.status && target.status.indexOf("Completed") !== -1;
      if (target && !isDone && target.payment === "Sifto Wallet") {
        walletBalance += target.total;
        updateWalletDisplay();
      }

      activeBookings = activeBookings.filter(item => item.id !== bookingId);
      if (trackedBookingId === bookingId) {
        if (trackerTimer) {
          clearInterval(trackerTimer);
          trackerTimer = null;
        }
        document.getElementById("live-tracker-card").classList.remove("visible");
        document.getElementById("chat-card").classList.remove("visible");
      }
      saveBookingsToStorage();
      renderBookings();
    }

    function renderPartnerConsole() {
      const partnerList = document.getElementById("partner-jobs-list");
      const earningsEl = document.getElementById("pro-stat-earnings");
      const activeJobsEl = document.getElementById("pro-stat-active");
      const ratingEl = document.getElementById("pro-stat-rating");
      if (!partnerList) return;

      const completedJobs = activeBookings.filter(b => b.status && b.status.indexOf("Completed") !== -1);
      const activeJobs = activeBookings.filter(b => !b.status || b.status.indexOf("Completed") === -1);
      const totalEarnings = completedJobs.reduce((sum, b) => sum + (b.total || 0), 0);

      const ratedJobs = completedJobs.filter(b => b.rating && b.rating > 0);
      const avgRating =
        ratedJobs.length > 0
          ? (ratedJobs.reduce((sum, b) => sum + b.rating, 0) / ratedJobs.length).toFixed(1) + "★"
          : "4.9★";

      if (earningsEl) earningsEl.textContent = "₹" + totalEarnings;
      if (activeJobsEl) activeJobsEl.textContent = String(activeJobs.length);
      if (ratingEl) ratingEl.textContent = avgRating;

      if (activeBookings.length === 0) {
        partnerList.innerHTML =
          '<div class="empty-state">No customer bookings yet. Create a booking on the Book tab to dispatch it here!</div>';
        return;
      }

      const stageNames = ["1. Assigned", "2. En Route 🛵", "3. At Door 🏠", "4. Working 🧹"];
      partnerList.innerHTML = "";
      activeBookings.forEach(item => {
        const isDone = item.status && item.status.indexOf("Completed") !== -1;
        const card = document.createElement("div");
        card.className = isDone ? "booking-item completed" : "booking-item";

        const info = document.createElement("div");
        info.className = "booking-item-info";
        const stageLabel = isDone ? "✅ Completed (Earned ₹" + item.total + ")" : stageNames[item.stage || 0];
        info.innerHTML =
          '<div class="booking-item-title">' + item.service + ' · ₹' + item.total + ' (' + item.hours + ' hr)</div>' +
          '<div class="booking-item-sub">Assigned Pro: ' + item.pro + ' · OTP: ' + (item.otp || "4829") + '</div>' +
          '<div class="booking-item-sub">📍 ' + item.address + ' · Status: <strong>' + stageLabel + '</strong></div>';

        const actions = document.createElement("div");
        actions.className = "booking-actions";

        if (!isDone) {
          if ((item.stage || 0) < 3) {
            const stepBtn = document.createElement("button");
            stepBtn.className = "track-btn";
            stepBtn.textContent = "Advance Stage ▶";
            stepBtn.addEventListener("click", function() {
              partnerAdvanceJob(item.id);
            });
            actions.appendChild(stepBtn);
          }

          const finishBtn = document.createElement("button");
          finishBtn.className = "done-btn";
          finishBtn.textContent = "Complete Job ✅";
          finishBtn.addEventListener("click", function() {
            completeBooking(item.id);
          });
          actions.appendChild(finishBtn);
        }

        card.appendChild(info);
        card.appendChild(actions);
        partnerList.appendChild(card);
      });
    }

    function renderBookings() {
      const listContainer = document.getElementById("bookings-list");
      const countBadge = document.getElementById("booking-count");
      const navBadge = document.getElementById("nav-bookings-badge");
      const searchInput = document.getElementById("search-bookings-input");
      const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

      countBadge.textContent = activeBookings.length + " saved";
      if (navBadge) {
        navBadge.textContent = String(activeBookings.length);
      }

      const statTotal = document.getElementById("stat-total-bookings");
      const statSaved = document.getElementById("stat-total-saved");
      if (statTotal) statTotal.textContent = String(activeBookings.length);
      if (statSaved) {
        const totalSaved = activeBookings.reduce((sum, b) => sum + (b.discount || 0), 0);
        statSaved.textContent = "₹" + totalSaved;
      }

      renderPartnerConsole();

      const filtered = activeBookings.filter(item => {
        const isDone = item.status && item.status.indexOf("Completed") !== -1;
        if (currentFilter === "ACTIVE" && isDone) return false;
        if (currentFilter === "COMPLETED" && !isDone) return false;

        if (query) {
          const haystack = (
            (item.service || "") + " " +
            (item.pro || "") + " " +
            (item.address || "") + " " +
            (item.id || "") + " " +
            (item.note || "")
          ).toLowerCase();
          return haystack.indexOf(query) !== -1;
        }
        return true;
      });

      if (filtered.length === 0) {
        listContainer.innerHTML =
          '<div class="empty-state">No matching bookings found.</div>';
        return;
      }

      listContainer.innerHTML = "";
      filtered.forEach(item => {
        const row = document.createElement("div");
        const isDone = item.status && item.status.indexOf("Completed") !== -1;
        row.className = isDone ? "booking-item completed" : "booking-item";

        const info = document.createElement("div");
        info.className = "booking-item-info";
        const statusBadge = isDone ? " · ✅ Completed" : " · 🟢 Active";
        const noteHtml = item.note ? '<div><span class="booking-note-tag">📝 ' + item.note + '</span></div>' : "";
        const paymentLabel = item.payment ? " · 💳 " + item.payment : "";
        const freqLabel = item.frequency === "Weekly Plan" ? " · 📅 Weekly" : "";

        info.innerHTML =
          '<div class="booking-item-title">' + item.service + ' (' + item.hours + ' hr · ₹' + item.total + ')' + freqLabel + statusBadge + '</div>' +
          '<div class="booking-item-sub">Pro: ' + item.pro + ' · ' + item.slot + '</div>' +
          '<div class="booking-item-sub">📍 ' + item.address + ' · #' + item.id + paymentLabel + '</div>' +
          noteHtml;

        if (isDone) {
          const ratingRow = document.createElement("div");
          ratingRow.className = "rating-row";
          const label = document.createElement("span");
          label.className = "rating-label";
          label.textContent = item.rating ? "Your Rating:" : "Rate Pro:";
          ratingRow.appendChild(label);

          for (let s = 1; s <= 5; s++) {
            const starBtn = document.createElement("button");
            starBtn.className = (item.rating && s <= item.rating) ? "star-btn rated" : "star-btn";
            starBtn.textContent = s + "★";
            starBtn.addEventListener("click", function() {
              rateBooking(item.id, s);
            });
            ratingRow.appendChild(starBtn);
          }
          info.appendChild(ratingRow);
        }

        const actions = document.createElement("div");
        actions.className = "booking-actions";

        if (!isDone) {
          const trackBtn = document.createElement("button");
          trackBtn.className = "track-btn";
          trackBtn.textContent = "Track Live 📍";
          trackBtn.addEventListener("click", function() {
            startLiveTracker(item);
          });
          actions.appendChild(trackBtn);

          const doneBtn = document.createElement("button");
          doneBtn.className = "done-btn";
          doneBtn.textContent = "Mark Done";
          doneBtn.addEventListener("click", function() {
            completeBooking(item.id);
          });
          actions.appendChild(doneBtn);
        }

        if (isDone) {
          const rebookBtn = document.createElement("button");
          rebookBtn.className = "track-btn";
          rebookBtn.textContent = "Rebook 🔄";
          rebookBtn.addEventListener("click", function() {
            rebookBooking(item.id);
          });
          actions.appendChild(rebookBtn);
        }

        const receiptBtn = document.createElement("button");
        receiptBtn.className = "receipt-btn";
        receiptBtn.textContent = "Receipt 🧾";
        receiptBtn.addEventListener("click", function() {
          openReceiptModal(item.id);
        });
        actions.appendChild(receiptBtn);

        const cancelBtn = document.createElement("button");
        cancelBtn.className = "cancel-btn";
        cancelBtn.textContent = isDone ? "Remove" : "Cancel";
        cancelBtn.addEventListener("click", function() {
          cancelBooking(item.id);
        });
        actions.appendChild(cancelBtn);

        row.appendChild(info);
        row.appendChild(actions);
        listContainer.appendChild(row);
      });
    }

    loadSavedBookings();
