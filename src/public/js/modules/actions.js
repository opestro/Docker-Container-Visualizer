// Actions module - handles container control actions
import { updateGraph } from './graph.js';
import { showStatusMessage } from './ui.js';

// Initialize global click handler for action buttons
let isInitialized = false;

// Set up container action buttons
export function setupContainerActions() {
    // Only set up the global handler once
    if (!isInitialized) {
        console.log('Setting up global action button handler');
        // Use event delegation on document instead of direct binding
        document.addEventListener('click', function(event) {
            // Check if the clicked element or any of its parents have the action-button class
            const button = event.target.closest('.action-button');
            if (button) {
                console.log('Button clicked:', button.innerText.trim());
                event.stopPropagation(); // Prevent event from bubbling up to Cytoscape
                event.preventDefault();   // Prevent any default behavior
                handleActionButtonClick(event, button);
            }
        });
        isInitialized = true;
    }
}

// Handle action button clicks
async function handleActionButtonClick(event, button) {
    console.log('Action button clicked:', button);
    
    const action = button.getAttribute('data-action');
    const containerId = button.getAttribute('data-id');
    
    if (!action || !containerId) {
        console.log('Missing action or containerId:', { action, containerId });
        return;
    }
    
    try {
        const apiUrl = `/api/containers/${containerId}/${action}`;
        console.log(`Executing ${action} on container ${containerId}`);
        console.log(`API URL: ${apiUrl}`);
        
        // Disable the button during action
        button.classList.add('disabled');
        button.style.opacity = '0.5';
        
        // Show status message
        showStatusMessage(`Executing ${action} on container...`, 'info');
        
        // Call API with more detailed logging
        console.log('Sending POST request to:', apiUrl);
        
        // Create the fetch request
        const fetchPromise = fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Log when the request is sent
        console.log('Request sent, waiting for response...');
        
        // Wait for the response
        const response = await fetchPromise;
        console.log('Response received:', response);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response text:', errorText);
            
            let errorMessage;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error || `Failed to ${action} container`;
            } catch (e) {
                errorMessage = `Failed to ${action} container: ${response.status} ${response.statusText}`;
            }
            
            throw new Error(errorMessage);
        }
        
        // Log the response data
        const responseText = await response.text();
        console.log('Success response text:', responseText);
        
        let responseData;
        try {
            responseData = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
            console.warn('Could not parse response as JSON:', e);
            responseData = { success: true };
        }
        
        console.log('Success response data:', responseData);
        
        // Show success message
        showStatusMessage(`Successfully executed ${action}`, 'success');
        
        // Refresh graph after a delay
        console.log('Scheduling graph update in 1 second');
        setTimeout(() => {
            console.log('Updating graph after action');
            updateGraph();
        }, 1000);
    } catch (error) {
        console.error(`Error executing ${action}:`, error);
        showStatusMessage(`Error: ${error.message}`, 'error');
    } finally {
        // Re-enable the button
        button.classList.remove('disabled');
        button.style.opacity = '1';
    }
}

// Execute container action
export async function executeContainerAction(containerId, action) {
    if (!containerId || !action) {
        throw new Error('Container ID and action are required');
    }
    
    try {
        const apiUrl = `/api/containers/${containerId}/${action}`;
        console.log(`Executing ${action} on container ${containerId} via API`);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to ${action} container`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Error executing ${action}:`, error);
        throw error;
    }
} 