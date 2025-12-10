/**
 * EXPENSE TRACKER - CHART UTILITIES
 * Advanced chart handling and visualization
 */

// This file is reserved for advanced chart operations
// Current implementation uses Chart.js in ui.js

// ===== CHART COLOR THEMES =====

const chartThemes = {
    dark: {
        text: '#f1f5f9',
        grid: '#334155',
        background: '#1e293b',
        colors: [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
            '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'
        ]
    },
    light: {
        text: '#1e293b',
        grid: '#e2e8f0',
        background: '#ffffff',
        colors: [
            '#1e40af', '#047857', '#d97706', '#dc2626',
            '#7c3aed', '#0891b2', '#be185d', '#ea580c'
        ]
    }
};

// ===== GET CURRENT THEME =====

function getCurrentChartTheme() {
    const isDark = !document.body.classList.contains('light-theme');
    return isDark ? chartThemes.dark : chartThemes.light;
}

// ===== CHART CONFIGURATION HELPERS =====

function getChartOptions(type = 'bar') {
    const theme = getCurrentChartTheme();
    
    const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: theme.text,
                    font: { size: 12, family: "system-ui, -apple-system" }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: theme.text,
                bodyColor: theme.text,
                borderColor: theme.grid,
                borderWidth: 1,
                padding: 10,
                displayColors: true
            }
        }
    };
    
    if (type === 'bar') {
        return {
            ...baseOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: theme.text },
                    grid: { color: theme.grid, drawBorder: false }
                },
                x: {
                    ticks: { color: theme.text },
                    grid: { display: false }
                }
            }
        };
    } else if (type === 'doughnut' || type === 'pie') {
        return {
            ...baseOptions,
            plugins: {
                ...baseOptions.plugins,
                legend: {
                    ...baseOptions.plugins.legend,
                    position: 'bottom'
                }
            }
        };
    }
    
    return baseOptions;
}

// ===== ANIMATION FUNCTIONS =====

function animateValue(element, start, end, duration = 1000) {
    let startTimestamp = null;
    
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        if (element) {
            const value = Math.floor(progress * (end - start) + start);
            element.textContent = value;
        }
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    
    window.requestAnimationFrame(step);
}

// ===== EXPORT CHART =====

function exportChart(chartId, filename) {
    const canvas = document.getElementById(chartId);
    if (!canvas) {
        console.error('Chart not found');
        return;
    }
    
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = filename || `chart_${new Date().getTime()}.png`;
    link.click();
}
