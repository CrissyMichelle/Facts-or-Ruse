"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, showDeleteBtn = false) {
  console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  //show favorite/not favorite star icon for logged in user
  const showStar = Boolean(currentUser);
  return $(`
      <li id="${story.storyId}">
      ${showDeleteBtn ? getDeleteBtnHTML() : ""}
      ${showStar ? getStarHTML(story, currentUser) : ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}
/** Delete btn and star icon for HTML */
function getDeleteBtnHTML() {
  return `<span class="trash-can">
  <i class="fas fa-trash-alt"></i>
  </span>`;
}
function getStarHTML(story, user) {
  const isFavorite = user.isFavorite(story);
  const starType = isFavorite ? "fas" : "far";
  return `<span class="star">
  <i class="${starType} fa-star"></i>
  </span>`;
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

//Functionality for deleting a story
async function deleteStory(evt) {
  console.debug("deleteStory");

  const $closestLi = $(evt.target).closest("li");
  const storyId = $closestLi.attr("id");

  await storyList.removeStory(currentUser, storyId);
  //adjust story list to accommodate deletion
  putUserStoriesOnPage();
}
$ownStories.on("click", ".trash-can", deleteStory);

/** Functionality for users clicking submit on the submit-story form */
async function submitNewStory(evt) {
  console.debug("submitNewStory");
  evt.preventDefault();

  //Get the data from the form and make a story object
  const title = document.querySelector("#create-title").value;
  const url = document.querySelector("#create-url").value;
  const author = document.querySelector("#create-author").value;
  const username = currentUser.username;
  console.log(title, url, author);
  const storyData = { title, url, author };
  //add new story to the list of stories using addStory method
  const newStory = await storyList.addStory(currentUser, storyData);
  //put new story on the html
  const $story = generateStoryMarkup(newStory);
  $allStoriesList.prepend($story);
  //slick transitioning for after user submits new story data
  $submitForm.slideUp("slow");
  $submitForm.trigger("reset");
}
$submitForm.on("submit", submitNewStory);

function putUserStoriesOnPage() {
  console.debug("putUserStoriesOnPage");

  $ownStories.empty()

  if(currentUser.ownStories.length === 0) {
    $ownStories.append("<h5>No stories added by user yet...</h5>");
  } else {
    //generate HTML for all user stories
    for(let story of currentUser.ownStories) {
      let $story = generateStoryMarkup(story, true);
      $ownStories.append($story);
    }
  }
  $ownStories.show();
}

//Handling the favorites functionality

//Put the favorites list on the HTML
function putFavoritesListOnPage() {
  console.debug("putFavoritesListOnPage");

  $favoritedStories.empty();

  if(currentUser.favorites.length === 0) {
    $favoritedStories.append("<h5>No favorites added yet?</h5>");
  } else {
    //put all the user favorites on the HTML
    for(let fave of currentUser.favorites) {
      const $fave = generateStoryMarkup(fave);
      $favoritedStories.append($fave);
    }
  }
  $favoritedStories.show();
}
//favorite/un-favorite a story
async function toggleStoryFavorite(evt) {
  console.debug("toggleStoryFavorite");

  const $tgt = $(evt.target);
  const $closestLi = $tgt.closest("li");
  const storyId = $closestLi.attr("id");
  const story = storyList.stories.find(s => s.storyId === storyId);
  //check if star is present
  if($tgt.hasClass("fas")) {
    //story is currently a fave->remove from list and change star
    await currentUser.removeFavorite(story);
    $tgt.closest("i").toggleClass("fas far");
  } else {
    //currently not a fave->add to list and activate star
    await currentUser.addFavorite(story);
    $tgt.closest("i").toggleClass("fas far");
  }
}
$storiesLists.on("click", ".star", toggleStoryFavorite);