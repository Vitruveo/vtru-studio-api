import { CreatorDocument } from '../model';
import * as model from '../model';

type StepType = {
    name: string;
    completed: boolean;
    points?: number;
};

type LevelsType = {
    name: string;
    steps: StepType[];
};

export const getLevelsCompleted = (levels: LevelsType[]) =>
    levels.reduce((acc, cur, i) => {
        const checkLevels = Object.keys(acc).length;
        if (i === 0 || checkLevels === i) {
            const completed = !cur.steps.filter((step) => !step.completed)
                .length;
            if (completed) return { ...acc, [cur.name]: completed };
        }
        return acc;
    }, {});

export const getCurrentLevel = (levels: LevelsType[]) => {
    const completedLevels = getLevelsCompleted(levels);
    return Object.keys(completedLevels).length - 1;
};

const isCompleted = (value: unknown): boolean => Boolean(value);

const checkSynapsStep = (
    synaps: CreatorDocument['synaps'] | undefined,
    stepName: string,
    status: string
): boolean =>
    synaps?.steps?.some(
        (step) => step.name === stepName && step.status === status
    ) || false;

const buildLevels = (creatorDoc: CreatorDocument): LevelsType[] => {
    const {
        vault,
        emails,
        socials,
        profile: { avatar },
        myWebsite,
        synaps,
    } = creatorDoc;

    return [
        {
            name: 'Level 0',
            steps: [{ name: 'Email', completed: isCompleted(emails.length) }],
        },
        {
            name: 'Level 1',
            steps: [
                { name: 'Avatar', completed: isCompleted(avatar), points: 100 },
                {
                    name: 'Social',
                    completed: isCompleted(socials?.x?.name),
                    points: 100,
                },
                {
                    name: 'Profile Link',
                    completed: isCompleted(myWebsite),
                    points: 100,
                },
                {
                    name: 'Vault',
                    completed: isCompleted(vault.vaultAddress),
                    points: 200,
                },
            ],
        },
        {
            name: 'Level 2',
            steps: [
                {
                    name: 'Liveness',
                    completed: checkSynapsStep(synaps, 'LIVENESS', 'APPROVED'),
                    points: 1000,
                },
                {
                    name: 'ID+AML',
                    completed: checkSynapsStep(
                        synaps,
                        'ID_DOCUMENT',
                        'APPROVED'
                    ),
                    points: 1500,
                },
                { name: '0 Facts', completed: false, points: 1500 },
            ],
        },
        {
            name: 'Level 3',
            steps: [
                {
                    name: 'Address',
                    completed: checkSynapsStep(
                        synaps,
                        'PROOF_OF_ADDRESS',
                        'APPROVED'
                    ),
                    points: 1000,
                },
                {
                    name: 'Phone',
                    completed: checkSynapsStep(synaps, 'PHONE', 'APPROVED'),
                    points: 500,
                },
                { name: '0 Facts', completed: false, points: 1500 },
            ],
        },
        {
            name: 'Level 4',
            steps: [{ name: '0 Facts', completed: false, points: 2500 }],
        },
    ];
};

export const creatorTruLevelCalc = async ({
    creatorDoc,
}: {
    creatorDoc: CreatorDocument;
}) => {
    if (!creatorDoc) {
        throw new Error('creatorDoc is required');
    }

    try {
        const levels = buildLevels(creatorDoc);
        const currentLevel = getCurrentLevel(levels);

        const truLevel = { currentLevel, levels };

        await model.changeTruLevel({
            id: creatorDoc._id,
            truLevel,
        });
    } catch (error) {
        console.error('Failed to calculate creator truLevel:', error);
        throw error;
    }
};
