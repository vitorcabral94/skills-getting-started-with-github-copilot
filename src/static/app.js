document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    // Hide message after 5 seconds
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch(`/activities?t=${Date.now()}`, {
        cache: "no-store",
      });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = "<option value=\"\">-- Select an activity --</option>";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Participants</h5>
            <ul class="participant-list"></ul>
          </div>
        `;

        const participantList = activityCard.querySelector(".participant-list");

        if (details.participants.length === 0) {
          const emptyItem = document.createElement("li");
          emptyItem.className = "no-participants";
          emptyItem.textContent = "No participants yet";
          participantList.appendChild(emptyItem);
        } else {
          details.participants.forEach((participantEmail) => {
            const participantItem = document.createElement("li");
            participantItem.className = "participant-row";

            const participantEmailText = document.createElement("span");
            participantEmailText.className = "participant-email";
            participantEmailText.textContent = participantEmail;

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "participant-delete-button";
            removeButton.setAttribute("aria-label", `Remove ${participantEmail}`);
            removeButton.title = "Unregister participant";
            removeButton.textContent = "x";

            removeButton.addEventListener("click", async () => {
              try {
                const unregisterResponse = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(participantEmail)}`,
                  {
                    method: "DELETE",
                  }
                );

                const unregisterResult = await unregisterResponse.json();

                if (unregisterResponse.ok) {
                  showMessage(unregisterResult.message, "success");
                  await fetchActivities();
                } else {
                  showMessage(unregisterResult.detail || "Unable to unregister participant", "error");
                }
              } catch (error) {
                showMessage("Failed to unregister participant. Please try again.", "error");
                console.error("Error unregistering participant:", error);
              }
            });

            participantItem.appendChild(participantEmailText);
            participantItem.appendChild(removeButton);
            participantList.appendChild(participantItem);
          });
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
