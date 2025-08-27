/**
 * Geometry Processing Web Worker
 * Handles heavy Turf.js calculations in background thread to prevent UI blocking
 */

// Import Turf.js in worker context
importScripts('https://cdn.jsdelivr.net/npm/@turf/turf@6.5.0/turf.min.js');

console.log('GeometryWorker: Worker script loaded');

// Worker message handler
self.addEventListener('message', async (event) => {
  const { id, type, data } = event.data;
  
  try {
    let result;
    
    switch (type) {
      case 'calculateOverlaps':
        result = await calculateOverlaps(data);
        break;
        
      case 'findAdjacent':
        result = await findAdjacent(data);
        break;
        
      case 'calculateContainment':
        result = await calculateContainment(data);
        break;
        
      case 'simplifyGeometry':
        result = await simplifyGeometry(data);
        break;
        
      case 'calculateDistance':
        result = await calculateDistance(data);
        break;
        
      case 'bufferGeometry':
        result = await bufferGeometry(data);
        break;
        
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
    
    // Send result back to main thread
    self.postMessage({
      id,
      type: 'success',
      result
    });
    
  } catch (error) {
    console.error('GeometryWorker: Operation failed:', error);
    
    // Send error back to main thread
    self.postMessage({
      id,
      type: 'error',
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }
});

/**
 * Calculate overlaps between polygons
 */
async function calculateOverlaps({ sourcePolygons, targetPolygons, options = {} }) {
  const results = [];
  const batchSize = options.batchSize || 10;
  
  for (let i = 0; i < sourcePolygons.length; i += batchSize) {
    const batch = sourcePolygons.slice(i, i + batchSize);
    
    for (const sourcePoly of batch) {
      const overlaps = [];
      
      for (const targetPoly of targetPolygons) {
        try {
          // Use Turf.js to calculate intersection
          const intersection = turf.intersect(sourcePoly, targetPoly);
          
          if (intersection) {
            const overlapArea = turf.area(intersection);
            const sourceArea = turf.area(sourcePoly);
            const overlapPercentage = (overlapArea / sourceArea) * 100;
            
            if (overlapPercentage > (options.minOverlapPercent || 1)) {
              overlaps.push({
                targetId: targetPoly.properties?.id || targetPoly.id,
                targetName: targetPoly.properties?.name || 'Unknown',
                overlapArea,
                overlapPercentage,
                intersection
              });
            }
          }
        } catch (error) {
          console.warn('GeometryWorker: Overlap calculation failed for polygon:', error);
        }
      }
      
      if (overlaps.length > 0) {
        results.push({
          sourceId: sourcePoly.properties?.id || sourcePoly.id,
          sourceName: sourcePoly.properties?.name || 'Unknown',
          overlaps
        });
      }
    }
    
    // Yield control periodically
    if (i % batchSize === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  return results;
}

/**
 * Find adjacent polygons (share boundary)
 */
async function findAdjacent({ sourcePolygons, targetPolygons, options = {} }) {
  const results = [];
  const tolerance = options.tolerance || 0.001; // km
  
  for (const sourcePoly of sourcePolygons) {
    const adjacent = [];
    
    for (const targetPoly of targetPolygons) {
      try {
        // Calculate distance between polygon boundaries
        const distance = turf.distance(
          turf.centroid(sourcePoly),
          turf.centroid(targetPoly),
          { units: 'kilometers' }
        );
        
        // Check if polygons share a boundary (simplified check)
        if (distance < tolerance) {
          // More precise boundary intersection check
          const buffered = turf.buffer(sourcePoly, tolerance, { units: 'kilometers' });
          const intersects = turf.booleanIntersects(buffered, targetPoly);
          
          if (intersects) {
            adjacent.push({
              targetId: targetPoly.properties?.id || targetPoly.id,
              targetName: targetPoly.properties?.name || 'Unknown',
              distance
            });
          }
        }
      } catch (error) {
        console.warn('GeometryWorker: Adjacency calculation failed:', error);
      }
    }
    
    if (adjacent.length > 0) {
      results.push({
        sourceId: sourcePoly.properties?.id || sourcePoly.id,
        sourceName: sourcePoly.properties?.name || 'Unknown',
        adjacent
      });
    }
  }
  
  return results;
}

/**
 * Calculate point-in-polygon containment
 */
async function calculateContainment({ points, polygons, options = {} }) {
  const results = [];
  
  for (const point of points) {
    const containers = [];
    
    for (const polygon of polygons) {
      try {
        if (turf.booleanPointInPolygon(point, polygon)) {
          containers.push({
            polygonId: polygon.properties?.id || polygon.id,
            polygonName: polygon.properties?.name || 'Unknown',
            polygonType: polygon.properties?.type || 'Unknown'
          });
        }
      } catch (error) {
        console.warn('GeometryWorker: Containment calculation failed:', error);
      }
    }
    
    if (containers.length > 0) {
      results.push({
        pointId: point.properties?.id || point.id,
        pointName: point.properties?.name || 'Unknown',
        coordinates: point.geometry.coordinates,
        containers
      });
    }
  }
  
  return results;
}

/**
 * Simplify geometry for performance
 */
async function simplifyGeometry({ features, options = {} }) {
  const tolerance = options.tolerance || 0.01;
  const highQuality = options.highQuality !== false;
  
  const simplified = features.map(feature => {
    try {
      return turf.simplify(feature, { tolerance, highQuality });
    } catch (error) {
      console.warn('GeometryWorker: Simplification failed for feature:', error);
      return feature; // Return original if simplification fails
    }
  });
  
  return simplified;
}

/**
 * Calculate distance between features
 */
async function calculateDistance({ fromFeatures, toFeatures, options = {} }) {
  const units = options.units || 'kilometers';
  const maxDistance = options.maxDistance || Infinity;
  const results = [];
  
  for (const fromFeature of fromFeatures) {
    const distances = [];
    
    for (const toFeature of toFeatures) {
      try {
        const distance = turf.distance(fromFeature, toFeature, { units });
        
        if (distance <= maxDistance) {
          distances.push({
            toId: toFeature.properties?.id || toFeature.id,
            toName: toFeature.properties?.name || 'Unknown',
            distance,
            units
          });
        }
      } catch (error) {
        console.warn('GeometryWorker: Distance calculation failed:', error);
      }
    }
    
    if (distances.length > 0) {
      // Sort by distance
      distances.sort((a, b) => a.distance - b.distance);
      
      results.push({
        fromId: fromFeature.properties?.id || fromFeature.id,
        fromName: fromFeature.properties?.name || 'Unknown',
        distances
      });
    }
  }
  
  return results;
}

/**
 * Create buffer around geometry
 */
async function bufferGeometry({ features, options = {} }) {
  const radius = options.radius || 1;
  const units = options.units || 'kilometers';
  const steps = options.steps || 8;
  
  const buffered = features.map(feature => {
    try {
      return turf.buffer(feature, radius, { units, steps });
    } catch (error) {
      console.warn('GeometryWorker: Buffer creation failed for feature:', error);
      return null;
    }
  }).filter(Boolean);
  
  return buffered;
}

console.log('GeometryWorker: Ready to process geometry operations');
