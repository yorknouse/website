(function ($) {
    "use strict";
    var osru = {
        initialize: function () {
            this.imgLoaded();
            this.tabHover();
            this.navHover();
            this.fullSkinSearch();
            this.masonrySlide();
            this.toTop();
            this.instagram();
            this.newsTicker();
            this.blogSlide();
            this.accordion();
            this.gallery();
            this.popupGallery();
            this.fixedFooter();
            this.parallax();
            this.stickySidebar();
            this.postSlider();
            this.postCarousel();
            this.videoSlider();
            this.pageLoader();
            this.imgfluidbox();
            this.socialShare();
            this.youtubeVideo();
            this.fbLikeBox();
        },
// -------------------------------------------------------------------------- //
// Page Loader Animsition
// -------------------------------------------------------------------------- //
        imgLoaded: function () {
            $('body').imagesLoaded(function () {
                // images have loaded
            });
        },
// -------------------------------------------------------------------------- //
// Tab Hover
// -------------------------------------------------------------------------- //
        tabHover: function () {
            $(document).off('click.bs.tab.data-api', '[data-hover="tab"]');
            $(document).on('mouseenter.bs.tab.data-api', '[data-toggle="tab"], [data-hover="tab"]', function () {
                $(this).tab('show');
            });
        },
// -------------------------------------------------------------------------- //
// Nav Hover
// -------------------------------------------------------------------------- //      
        navHover: function () {
            var b = "navFadeInUp";
            var c;
            var a;
            d($(".menu-tabs a"), $(".menu-tab-content"));
            function d(e, f, g) {
                e.hover(function (i) {
                    i.preventDefault();
                    $(this).tab("show");
                    var h = $(this).data("easein");
                    if (c) {
                        c.removeClass(a);
                    }
                    if (h) {
                        f.find("div.active").addClass("animated " + h);
                        a = h;
                    } else {
                        if (g) {
                            f.find("div.active").addClass("animated " + g);
                            a = g;
                        } else {
                            f.find("div.active").addClass("animated " + b);
                            a = b;
                        }
                    }
                    c = f.find("div.active");
                });
            }
            $("a[rel=popover]")
                    .popover()
                    .on('click', function (f) {
                        f.preventDefault();
                        if ($(this).data("easein") !== undefined) {
                            $(this)
                                    .next()
                                    .removeClass($(this).data("easein"))
                                    .addClass("animated " + $(this).data("easein"));
                        } else {
                            $(this)
                                    .next()
                                    .addClass("animated " + b);
                        }
                    });
        },
// -------------------------------------------------------------------------- //
// Full Skin Search
// -------------------------------------------------------------------------- //
        fullSkinSearch: function () {
            var openCtrl1 = document.getElementById('btn-search1'),
                    openCtrl2 = document.getElementById('btn-search2'),
                    closeCtrl = document.getElementById('btn-search-close'),
                    searchContainer = document.querySelector('.search'),
                    inputSearch = searchContainer.querySelector('.search__input');

            function init() {
                initEvents();
            }

            function initEvents() {
                openCtrl1.addEventListener('click', openSearch);
                openCtrl2.addEventListener('click', openSearch);
                closeCtrl.addEventListener('click', closeSearch);
                document.addEventListener('keyup', function (ev) {
                    // escape key.
                    if (ev.keyCode === 27) {
                        closeSearch();
                    }
                });
            }

            function openSearch() {
                searchContainer.classList.add('search--open');
                inputSearch.focus();
            }

            function closeSearch() {
                searchContainer.classList.remove('search--open');
                inputSearch.blur();
                inputSearch.value = '';
            }

            init();
        },
// -------------------------------------------------------------------------- //
// Masonry Slide
// -------------------------------------------------------------------------- //  
        masonrySlide: function () {
            $(".masonry-slide1").owlCarousel({
                autoPlay: 4000, //Set AutoPlay
                navigation: false, // Show next and prev buttons
                slideSpeed: 300,
                paginationSpeed: 400,
                singleItem: true
            });
            $(".masonry-slide2").owlCarousel({
                autoPlay: 4500, //Set AutoPlay
                navigation: false, // Show next and prev buttons
                slideSpeed: 300,
                paginationSpeed: 400,
                singleItem: true
            });
            $(".masonry-slide3").owlCarousel({
                autoPlay: 5000, //Set AutoPlay
                navigation: false, // Show next and prev buttons
                slideSpeed: 300,
                paginationSpeed: 400,
                singleItem: true
            });
            $(".masonry-slide4").owlCarousel({
                autoPlay: 5500, //Set AutoPlay
                navigation: false, // Show next and prev buttons
                slideSpeed: 300,
                paginationSpeed: 400,
                singleItem: true
            });
        },
// -------------------------------------------------------------------------- //
// Back to top
// -------------------------------------------------------------------------- //  
        toTop: function () {
            $('body').append('<div id="toTop" class="btn btn-top"><span class="ti-arrow-up"></span></div>');
            $(window).scroll(function () {
                if ($(this).scrollTop() !== 0) {
                    $('#toTop').fadeIn();
                } else {
                    $('#toTop').fadeOut();
                }
            });
            $('#toTop').on('click', function () {
                $("html, body").animate({scrollTop: 0}, 600);
                return false;
            });
        },
// -------------------------------------------------------------------------- //
// Instagram
// -------------------------------------------------------------------------- //
        instagram: function () {
            $('#ri-grid').gridrotator({
                rows: 1,
                columns: 8,
                animType: 'fadeInOut',
                animSpeed: 1000,
                step: 1,
                w1024: {
                    rows: 1,
                    columns: 7
                },
                w768: {
                    rows: 1,
                    columns: 5
                },
                w480: {
                    rows: 2,
                    columns: 3
                },
                w320: {
                    rows: 2,
                    columns: 3
                },
                w240: {
                    rows: 2,
                    columns: 3
                }
            });
        },
// -------------------------------------------------------------------------- //
// NewsTicker
// -------------------------------------------------------------------------- //
        newsTicker: function () {
            var owl = $("#newsTicker");
            owl.owlCarousel({
                autoPlay: 5000, //Set AutoPlay to 5 seconds
                singleItem: true,
                transitionStyle: "goDown",
                pagination: false,
                navigation: true,
                navigationText: [
                    "<i class='fa fa-angle-left'></i>",
                    "<i class='fa fa-angle-right'></i>"
                ]
            });
        },
// -------------------------------------------------------------------------- //
// Blog Slide
// -------------------------------------------------------------------------- //
        blogSlide: function () {
            var time = 7; // time in seconds
            var $progressBar,
                    $bar,
                    $elem,
                    isPause,
                    tick,
                    percentTime;

            //Init the carousel
            $("#blog-slide").owlCarousel({
                slideSpeed: 500,
                paginationSpeed: 500,
                singleItem: true,
                transitionStyle: "fade",
                pagination: false,
                dots: false,
                navigation: true,
                navigationText: [
                    "<i class='ti-angle-left'></i>",
                    "<i class='ti-angle-right'></i>"
                ],
                afterInit: progressBar,
                afterMove: moved,
                startDragging: pauseOnDragging
            });
            //Init progressBar where elem is $("#owl-demo")
            function progressBar(elem) {
                $elem = elem;
                //build progress bar elements
                buildProgressBar();
                //start counting
                start();
            }
            //create div#progressBar and div#bar then prepend to $("#owl-demo")
            function buildProgressBar() {
                $progressBar = $("<div>", {
                    id: "progressBar"
                });
                $bar = $("<div>", {
                    id: "bar"
                });
                $progressBar.append($bar).prependTo($elem);
            }
            function start() {
                //reset timer
                percentTime = 0;
                isPause = false;
                //run interval every 0.01 second
                tick = setInterval(interval, 10);
            }
            function interval() {
                if (isPause === false) {
                    percentTime += 1 / time;
                    $bar.css({
                        width: percentTime + "%"
                    });
                    //if percentTime is equal or greater than 100
                    if (percentTime >= 100) {
                        //slide to next item 
                        $elem.trigger('owl.next');
                    }
                }
            }
            //pause while dragging 
            function pauseOnDragging() {
                isPause = true;
            }
            //moved callback
            function moved() {
                //clear interval
                clearTimeout(tick);
                //start again
                start();
            }
        },
// -------------------------------------------------------------------------- //
// Accordion
// -------------------------------------------------------------------------- //   
        accordion: function () {
            $('.accordion > li:eq(0) a').addClass('active').next().slideDown();
            $('.accordion a').on('click', function (j) {
                var dropDown = $(this).closest('li').find('p');

                $(this).closest('.accordion').find('p').not(dropDown).slideUp();

                if ($(this).hasClass('active')) {
                    $(this).removeClass('active');
                } else {
                    $(this).closest('.accordion').find('a.active').removeClass('active');
                    $(this).addClass('active');
                }

                dropDown.stop(false, true).slideToggle();

                j.preventDefault();
            });
        },
// -------------------------------------------------------------------------- //
// Gallery
// -------------------------------------------------------------------------- //
        gallery: function () {
            var sync1 = $("#sync1");
            var sync2 = $("#sync2");
            sync1.owlCarousel({
                singleItem: true,
                slideSpeed: 1000,
                navigation: false,
                pagination: false,
                afterAction: syncPosition,
                responsiveRefreshRate: 200
            });
            sync2.owlCarousel({
                items: 5,
                itemsDesktop: [1199, 5],
                itemsDesktopSmall: [979, 5],
                itemsTablet: [768, 5],
                itemsMobile: [479, 4],
                pagination: false,
                responsiveRefreshRate: 100,
                afterInit: function (el) {
                    el.find(".owl-item").eq(0).addClass("synced");
                }
            });
            function syncPosition(el) {
                var current = this.currentItem;
                $("#sync2")
                        .find(".owl-item")
                        .removeClass("synced")
                        .eq(current)
                        .addClass("synced");
                if ($("#sync2").data("owlCarousel") !== undefined) {
                    center(current);
                }
            }
            $("#sync2").on("click", ".owl-item", function (e) {
                e.preventDefault();
                var number = $(this).data("owlItem");
                sync1.trigger("owl.goTo", number);
            });
            function center(number) {
                var sync2visible = sync2.data("owlCarousel").owl.visibleItems;
                var num = number;
                var found = false;
                for (var i in sync2visible) {
                    if (num === sync2visible[i]) {
                        var found = true;
                    }
                }

                if (found === false) {
                    if (num > sync2visible[sync2visible.length - 1]) {
                        sync2.trigger("owl.goTo", num - sync2visible.length + 2);
                    } else {
                        if (num - 1 === -1) {
                            num = 0;
                        }
                        sync2.trigger("owl.goTo", num);
                    }
                } else if (num === sync2visible[sync2visible.length - 1]) {
                    sync2.trigger("owl.goTo", sync2visible[1]);
                } else if (num === sync2visible[0]) {
                    sync2.trigger("owl.goTo", num - 1);
                }
            }
        },
// -------------------------------------------------------------------------- //
// Zoom Gallery
// -------------------------------------------------------------------------- //    
        popupGallery: function () {
            $('.popup-gallery').magnificPopup({
                delegate: 'a',
                type: 'image',
                tLoading: 'Loading image #%curr%...',
                mainClass: 'mfp-img-mobile',
                gallery: {
                    enabled: true,
                    navigateByImgClick: true,
                    preload: [0, 1] // Will preload 0 - before current, and 1 after the current image
                }
            });
        },
// -------------------------------------------------------------------------- //
// Fixed Footer
// -------------------------------------------------------------------------- //
        fixedFooter: function () {
            $('.footer-fixed').css('height', 'auto');
            var footerHeight = $('.footer-fixed').outerHeight();
            $('body').css('padding-bottom', footerHeight);
            $('.footer-fixed').css('height', footerHeight);
        },
// -------------------------------------------------------------------------- //
// Parallax Header
// -------------------------------------------------------------------------- //
        parallax: function () {
            $('.parallax').parallaxBackground();
        },
// -------------------------------------------------------------------------- //
// Sticky Sidebar
// -------------------------------------------------------------------------- //
        stickySidebar: function () {
            $('.leftSidebar, .content, .rightSidebar, .stickyshare, .stickydetails').theiaStickySidebar({
                additionalMarginTop: 30
            });
        },
// -------------------------------------------------------------------------- //
// Post Slider
// -------------------------------------------------------------------------- //
        postSlider: function () {
            $("#post-slide").owlCarousel({
                // autoPlay: 5000, //Set AutoPlay to 5 seconds
                items: 3,
                itemsDesktop: [1199, 3],
                itemsDesktopSmall: [980, 2],
                itemsTablet: [768, 1],
                itemsTabletSmall: false,
                itemsMobile: [479, 1],
                pagination: false,
                navigation: true,
                navigationText: [
                    "<i class='fa fa-angle-left'></i>",
                    "<i class='fa fa-angle-right'></i>"
                ]
            });
        },
// -------------------------------------------------------------------------- //
// Post Carousel
// -------------------------------------------------------------------------- //
        postCarousel: function () {
            $(".post-carousel").owlCarousel({
                autoPlay: 5000, //Set AutoPlay to 5 seconds
                items: 5,
                itemsDesktop: [1199, 2],
                itemsDesktopSmall: [980, 2],
                itemsTablet: [768, 2],
                itemsTabletSmall: false,
                itemsMobile: [479, 1],
                lazyLoad: true,
                navigation: true,
                navigationText: [
                    "<i class='fa fa-angle-left'></i>",
                    "<i class='fa fa-angle-right'></i>"
                ]
            });
        },
// -------------------------------------------------------------------------- //
// Video Slider
// -------------------------------------------------------------------------- //
        videoSlider: function () {
            $("#video_slide").owlCarousel({
                autoPlay: 5000, //Set AutoPlay to 5 seconds
                items: 1,
                itemsDesktop: [1199, 1],
                itemsDesktopSmall: [980, 1],
                itemsTablet: [768, 1],
                itemsTabletSmall: false,
                itemsMobile: [479, 1],
                navigation: false,
                singleItem: true,
                transitionStyle: "fade"
            });
        },
// -------------------------------------------------------------------------- //
// Page Loader Animsition
// -------------------------------------------------------------------------- //
        pageLoader: function () {
            $('.animsition').animsition();
        },
// -------------------------------------------------------------------------- //
// Image Fluid Box
// -------------------------------------------------------------------------- //
        imgfluidbox: function () {
            $('.fluidbox_img').fluidbox();
        },
// -------------------------------------------------------------------------- //
// Social Share
// -------------------------------------------------------------------------- //
        socialShare: function () {
            $('.boxed_icon').simpleSocialShare();
        },
// -------------------------------------------------------------------------- //
// Facebook Like Box
// -------------------------------------------------------------------------- //
        fbLikeBox: function () {
            (function (d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id))
                    return;
                js = d.createElement(s);
                js.id = id;
                js.src = 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v2.12';
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));
        },
// -------------------------------------------------------------------------- //
// Youtube video
// -------------------------------------------------------------------------- //    
        youtubeVideo: function () {
            // poster frame click event
            $(document).on("click", ".js-videoPoster", function (ev) {
                ev.preventDefault();
                var $poster = $(this);
                var $wrapper = $poster.closest(".js-videoWrapper");
                videoPlay($wrapper);
            });
            // play the targeted video (and hide the poster frame)
            function videoPlay($wrapper) {
                var $iframe = $wrapper.find(".js-videoIframe");
                var src = $iframe.data("src");
                // hide poster
                $wrapper.addClass("videoWrapperActive");
                // add iframe src in, starting the video
                $iframe.attr("src", src);
            }

            // stop the targeted/all videos (and re-instate the poster frames)
            function videoStop($wrapper) {
                // if we're stopping all videos on page
                if (!$wrapper) {
                    var $wrapper = $(".js-videoWrapper");
                    var $iframe = $(".js-videoIframe");
                    // if we're stopping a particular video
                } else {
                    var $iframe = $wrapper.find(".js-videoIframe");
                }
                // reveal poster
                $wrapper.removeClass("videoWrapperActive");
                // remove youtube link, stopping the video from playing in the background
                $iframe.attr("src", "");
            }

        }
    };
// -------------------------------------------------------------------------- //
// Filter portfolio
// -------------------------------------------------------------------------- // 
    var shuffleme = (function ($) {
        'use strict';
        var $grid = $('#grid'), //locate what we want to sort 
                $filterOptions = $('.portfolio-sorting li'), //locate the filter categories
                $sizer = $grid.find('.shuffle_sizer'), //sizer stores the size of the items

                init = function () {

                    // None of these need to be executed synchronously
                    setTimeout(function () {
                        listen();
                        setupFilters();
                    }, 100);

                    // instantiate the plugin
                    $grid.shuffle({
                        itemSelector: '[class*="col-"]',
                        sizer: $sizer
                    });
                },
                // Set up button clicks
                setupFilters = function () {
                    var $btns = $filterOptions.children();
                    $btns.on('click', function (e) {
                        e.preventDefault();
                        var $this = $(this),
                                isActive = $this.hasClass('active'),
                                group = isActive ? 'all' : $this.data('group');

                        // Hide current label, show current label in title
                        if (!isActive) {
                            $('.portfolio-sorting li a').removeClass('active');
                        }

                        $this.toggleClass('active');

                        // Filter elements
                        $grid.shuffle('shuffle', group);
                    });

                    $btns = null;
                },
                // Re layout shuffle when images load. This is only needed
                // below 768 pixels because the .picture-item height is auto and therefore
                // the height of the picture-item is dependent on the image
                // I recommend using imagesloaded to determine when an image is loaded
                // but that doesn't support IE7
                listen = function () {
                    var debouncedLayout = $.throttle(300, function () {
                        $grid.shuffle('update');
                    });

                    // Get all images inside shuffle
                    $grid.find('img').each(function () {
                        var proxyImage;

                        // Image already loaded
                        if (this.complete && this.naturalWidth !== undefined) {
                            return;
                        }

                        // If none of the checks above matched, simulate loading on detached element.
                        proxyImage = new Image();
                        $(proxyImage).on('load', function () {
                            $(this).off('load');
                            debouncedLayout();
                        });

                        proxyImage.src = this.src;
                    });

                    // Because this method doesn't seem to be perfect.
                    setTimeout(function () {
                        debouncedLayout();
                    }, 500);
                };

        return {
            init: init
        };

    }(jQuery));

    // Initialize
    $(document).ready(function () {
        osru.initialize();
        shuffleme.init(); //Filter Portfolio
        //Reading Time
        $('.post_details').readingTime({
            readingTimeTarget: $(this).find('.eta'),
            wordCountTarget: $(this).find('.words')
        });
    });
    // Reset on resize
    $(window).on("resize", function () {
        osru.fixedFooter();
    });
}(jQuery));