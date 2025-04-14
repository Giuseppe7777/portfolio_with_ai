$(function() {

    $('.navbar-toggle').click(function() {
        $(this).toggleClass('act');
            if($(this).hasClass('act')) {
                $('.main-menu').addClass('act');
            }
            else {
                $('.main-menu').removeClass('act');
            }
    });

    
    $(document).on('click', '.page-scroll a', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 1000, 'easeInOutExpo');
        event.preventDefault();
    });

    
    $('body').scrollspy({
        target: '.site-header',
        offset: 10
    });

    var $section = $('.section-skills');

    function loadDaBars() {
        $('.progress .progress-bar').each(function() {
            $(this).css('width', '0%'); 
            var transitionGoal = $(this).attr('data-transitiongoal');
            $(this).stop().animate({ width: transitionGoal + "%" }, 1000);
        });
    }

    function resetDaBars() {
        $('.progress .progress-bar').css('width', '0%'); 
    }

    if ('IntersectionObserver' in window) {
        let observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadDaBars();
                } else {
                    resetDaBars(); 
                }
            });
        }, { threshold: 0.3 });

        observer.observe($section[0]);
    }

    /* Counters  */
    if ($(".section-counters .start").length>0) {
        $(".section-counters .start").each(function() {
            var stat_item = $(this),
            offset = stat_item.offset().top;
            $(window).scroll(function() {
                if($(window).scrollTop() > (offset - 1000) && !(stat_item.hasClass('counting'))) {
                    stat_item.addClass('counting');
                    stat_item.countTo();
                }
            });
        });
    };

	// another custom callback for counting to infinity
	$('#infinity').data('countToOptions', {
		onComplete: function (value) {
            count.call(this, {
            from: value,
            to: value + 1
            });
		}
	});

	$('#infinity').each(count);

	function count(options) {
        var $this = $(this);
        options = $.extend({}, options || {}, $this.data('countToOptions') || {});
        $this.countTo(options);
    }

    // Navigation overlay
    var s = skrollr.init({
            forceHeight: false,
            smoothScrolling: false,
            mobileDeceleration: 0.004,
            mobileCheck: function() {
                //hack - forces mobile version to be off
                return false;
            }
    });
    
});

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contact-form");
    const messageContainer = document.createElement("div"); 

    messageContainer.id = "message-container";
    messageContainer.style.position = "absolute";
    messageContainer.style.bottom = "50%"; 
    messageContainer.style.left = "50%";
    messageContainer.style.transform = "translateX(-50%)"; 
    messageContainer.style.marginBottom = "10px"; 
    messageContainer.style.opacity = "0"; 
    messageContainer.style.transition = "opacity 0.5s ease"; 
    messageContainer.style.padding = "5px 25px"; 
    messageContainer.style.border = "1px solid green"; 
    messageContainer.style.backgroundColor = "green"; 

    form.style.position = "relative"; 
    form.appendChild(messageContainer);

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const formData = new FormData(form);

        fetch(`${BASE_URL}/php/contact.php`, {
            method: "POST",
            body: formData,
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === "success") {
                    messageContainer.textContent = data.message;
                    messageContainer.style.color = "white";
                    messageContainer.style.opacity = "1"; 
                    form.reset();

                    setTimeout(() => {
                        messageContainer.style.opacity = "0"; 
                    }, 5000);
                } else {
                    messageContainer.textContent = data.message;
                    messageContainer.style.color = "red";
                    messageContainer.style.opacity = "1"; 

                    setTimeout(() => {
                        messageContainer.style.opacity = "0"; 
                    }, 5000);
                }
            })
            .catch(error => {
                messageContainer.textContent =
                    "An error occurred. Please try again later.";
                messageContainer.style.color = "red";
                messageContainer.style.opacity = "1"; 

                setTimeout(() => {
                    messageContainer.style.opacity = "0"; 
                }, 5000);

                console.error("Error:", error);
            });
    });


// Joke ===============================================

  const jokeContainer = document.querySelector(".joke");
  const jokeText = document.querySelector(".joke-text"); 
  const jokeClose = document.querySelector(".joke-close");
  const jokeButton = document.querySelector(".joke-refresh"); 
  const emojiItems = document.querySelectorAll(".emoji-item");

  let typingTimeout; 
  let isTyping = false;
  let isActive = true; 

  function typeEffect(element, text, delay = 30, callback) {
      clearTimeout(typingTimeout); 
      isTyping = true; 
      element.innerHTML = ''; 
      let index = 0;

      function addLetter() {
          if (!isTyping) return; 
          if (index < text.length) {
              if (text[index] === "<" && text.slice(index, index + 4) === "<br>") {
                  element.innerHTML += "<br>";
                  index += 4;
              } else {
                  element.innerHTML += text[index]; 
                  index++;
              }
              typingTimeout = setTimeout(addLetter, delay); 
          } else {
              isTyping = false; 
              if (callback) callback();
          }
      }
      addLetter(); 
  }

  function capitalizeFirstLetter(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
  }

  jokeContainer.addEventListener('click', () => {
      if (!isActive) return; 

      isActive = false; 

      jokeButton.classList.remove("visible");
      jokeClose.classList.remove("visible");

      let xhr = new XMLHttpRequest();
      xhr.open('GET', `${BASE_URL}/php/proxy.php`);
      xhr.onload = function () {
          let response = JSON.parse(xhr.responseText);
          let joke = response['joke'];

          if (joke.includes("?")) {
              let parts = joke.split("?");         
              
              let question = "- " + capitalizeFirstLetter(parts[0].trim()) + "?";
              let answer = parts[1] ? "- " + capitalizeFirstLetter(parts[1].trim()) : "";

              let formattedJoke = question + "<br>" + answer;
              typeEffect(jokeText, formattedJoke, 70, () => {
                  setTimeout(() => {
                      emojiItems.forEach(emoji => emoji.classList.add("showme"));
                      setTimeout(() => {
                          emojiItems.forEach(emoji => emoji.classList.remove("showme"));
                          jokeButton.classList.add("visible");
                          jokeClose.classList.add("visible");
                          isActive = true; 
                      }, 5000);
                  }, 2000);
              });

          } else {
              typeEffect(jokeText, "- " + capitalizeFirstLetter(joke), 70, () => {
                  setTimeout(() => {
                      emojiItems.forEach(emoji => emoji.classList.add("showme"));
                      setTimeout(() => {
                          emojiItems.forEach(emoji => emoji.classList.remove("showme"));
                          jokeButton.classList.add("visible");
                          jokeClose.classList.add("visible");
                          isActive = true; 
                      }, 5000);
                  }, 2000);
              });
          }
      };
      xhr.send();

      setTimeout(() => {
          jokeContainer.classList.add("showme");
      }, 7000);
  });

  jokeClose.addEventListener("click", (event) => {
      event.stopPropagation(); 
      jokeText.textContent = "Make me laugh!";
      jokeContainer.classList.remove("showme");
      jokeButton.classList.remove("visible");
      jokeClose.classList.remove("visible");
      emojiItems.forEach(emoji => emoji.classList.remove("showme"));
      isActive = true; 
  });

  
});
