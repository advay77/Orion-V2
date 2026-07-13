import { getOrionSystem } from '@/lib/orion';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { objective } = await request.json();

    if (!objective || typeof objective !== 'string') {
      return NextResponse.json({ error: 'Objective is required' }, { status: 400 });
    }

    const orion = getOrionSystem();
    const plan = await orion.executePlan(objective);

    return NextResponse.json({
      success: true,
      plan,
      state: orion.getExecutionState(),
      summary: orion.getPlanSummary(),
    });
  } catch (error) {
    console.error('[v0] Error in /api/orion/plan:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create plan',
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const orion = getOrionSystem();
    const plan = orion.getCurrentPlan();

    return NextResponse.json({
      plan,
      state: orion.getExecutionState(),
      summary: orion.getPlanSummary(),
      memory: orion.getSharedMemory(),
    });
  } catch (error) {
    console.error('[v0] Error in /api/orion/plan GET:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get plan',
      },
      { status: 500 },
    );
  }
}
